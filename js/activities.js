function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
    if (runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }

    const tweet_array = runkeeper_tweets.map(tweet => new Tweet(tweet.text, tweet.created_at))
        .filter(tweet => tweet.source === 'completed_event');

    //count each activity type
    const counts = new Map();
    tweet_array.forEach(tweet => {
        const type = tweet.activityType;
        if (type !== 'unknown') counts.set(type, (counts.get(type) || 0) + 1);
    });

    const frequencies = Array.from(counts, ([activityType, count]) => ({activityType, count}))
        .sort((a, b) => b.count - a.count || a.activityType.localeCompare(b.activityType));
    const topTypes = frequencies.slice(0, 3).map(activity => activity.activityType);

    document.getElementById('numberActivities').textContent = frequencies.length;
    ['firstMost', 'secondMost', 'thirdMost'].forEach((id, index) => {
        document.getElementById(id).textContent = topTypes[index] || 'N/A';
    });

    //get valid distances for top 3 activities (use UTC for weekdays)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const distances = tweet_array
        .filter(tweet => topTypes.includes(tweet.activityType) &&
            tweet.distance > 0 && Number.isFinite(tweet.distance) && !Number.isNaN(tweet.time.getTime()))
        .map(tweet => ({
            activityType: tweet.activityType,
            distance: tweet.distance,
            day: days[tweet.time.getUTCDay()]
        }));

    //compare avg distance by activity/weekday
    const mean = values => values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
    const means = topTypes.map(activityType => ({
        activityType,
        mean: mean(distances.filter(activity => activity.activityType === activityType)
            .map(activity => activity.distance))
    })).sort((a, b) => b.mean - a.mean);

    document.getElementById('longestActivityType').textContent = means.length ? means[0].activityType : 'N/A';
    document.getElementById('shortestActivityType').textContent = means.length ? means[means.length - 1].activityType : 'N/A';

    const weekends = distances.filter(activity => activity.day === 'Saturday' || activity.day === 'Sunday');
    const weekdays = distances.filter(activity => activity.day !== 'Saturday' && activity.day !== 'Sunday');
    const weekendMean = mean(weekends.map(activity => activity.distance));
    const weekdayMean = mean(weekdays.map(activity => activity.distance));

    document.getElementById('weekdayOrWeekendLonger').textContent = !distances.length ? 'N/A' :
        weekendMean === weekdayMean ? 'weekdays and weekends equally' :
        weekendMean > weekdayMean ? 'weekends' : 'weekdays';

    //chart 1 (activity counts)
    const activity_vis_spec = {
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: 'Number of completed tweets for each activity type.',
        width: 600,
        height: 350,
        data: {values: frequencies},
        mark: 'bar',
        encoding: {
            x: {field: 'activityType', type: 'nominal', sort: '-y', title: 'Activity type', axis: {labelAngle: -45}},
            y: {field: 'count', type: 'quantitative', title: 'Number of tweets'},
            tooltip: [{field: 'activityType', title: 'Activity'}, {field: 'count', title: 'Tweets'}]
        }
    };

    //charts 2/3 (individual distances vs means)
    const distanceSpec = aggregate => ({
        $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
        description: aggregate ? 'Mean distance by weekday and activity.' : 'Individual activity distances by weekday.',
        width: 600,
        height: 350,
        data: {values: distances},
        mark: {type: 'point', filled: true, opacity: aggregate ? 1 : 0.3},
        encoding: {
            x: {field: 'day', type: 'ordinal', sort: days, title: 'Day of the week'},
            y: Object.assign(
                {field: 'distance', type: 'quantitative', title: aggregate ? 'Mean distance (miles)' : 'Distance (miles)'},
                aggregate ? {aggregate: 'mean'} : {}
            ),
            color: {field: 'activityType', type: 'nominal', title: 'Activity type', scale: {domain: topTypes}},
            tooltip: [
                {field: 'day', title: 'Day'},
                {field: 'activityType', title: 'Activity'},
                Object.assign(
                    {field: 'distance', type: 'quantitative', title: 'Miles', format: '.2f'},
                    aggregate ? {aggregate: 'mean'} : {}
                )
            ]
        }
    });

    //toggle individual/mean charts
    const individual = document.getElementById('distanceVis');
    const aggregated = document.getElementById('distanceVisAggregated');
    const button = document.getElementById('aggregate');

    individual.hidden = false;
    aggregated.hidden = true;
    button.textContent = 'Show means';
    button.setAttribute('aria-pressed', 'false');

    button.onclick = function () {
        const showMeans = aggregated.hidden;
        individual.hidden = showMeans;
        aggregated.hidden = !showMeans;
        button.textContent = showMeans ? 'Show individual distances' : 'Show means';
        button.setAttribute('aria-pressed', String(showMeans));
    };

    return Promise.all([
        vegaEmbed('#activityVis', activity_vis_spec, {actions: false}),
        vegaEmbed('#distanceVis', distanceSpec(false), {actions: false}),
        vegaEmbed('#distanceVisAggregated', distanceSpec(true), {actions: false})
    ]);
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
    loadSavedRunkeeperTweets().then(parseTweets).catch(console.error);
});
