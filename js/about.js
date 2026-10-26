function parseTweets(runkeeper_tweets) {
    //Do not proceed if no tweets loaded
    if (runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }

    const tweet_array = runkeeper_tweets.map(tweet => new Tweet(tweet.text, tweet.created_at));
    document.getElementById('numberTweets').textContent = tweet_array.length;

    //get earliest/latest dates (use UTC to match source data)
    const dates = tweet_array.map(tweet => tweet.time)
        .filter(date => !Number.isNaN(date.getTime()))
        .sort((a, b) => a - b);
    const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'};

    document.getElementById('firstDate').textContent = dates.length
        ? dates[0].toLocaleDateString('en-US', options) : 'No dates available';
    document.getElementById('lastDate').textContent = dates.length
        ? dates[dates.length - 1].toLocaleDateString('en-US', options) : 'No dates available';

    //count tweet categories/user-written tweets
    const counts = {completed_event: 0, live_event: 0, achievement: 0, miscellaneous: 0};
    let written = 0;

    tweet_array.forEach(tweet => {
        counts[tweet.source] += 1;
        if (tweet.source === 'completed_event' && tweet.written) written += 1;
    });

    const percentage = (count, total) => (total ? count / total * 100 : 0).toFixed(2) + '%';
    const setClass = (name, value) => {
        document.querySelectorAll('.' + name).forEach(span => {
            span.textContent = value;
        });
    };

    //fill in counts/percentages
    const categories = {
        completedEvents: 'completed_event',
        liveEvents: 'live_event',
        achievements: 'achievement',
        miscellaneous: 'miscellaneous'
    };

    Object.entries(categories).forEach(([name, source]) => {
        setClass(name, counts[source]);
        setClass(name + 'Pct', percentage(counts[source], tweet_array.length));
    });

    setClass('written', written);
    setClass('writtenPct', percentage(written, counts.completed_event));
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
    loadSavedRunkeeperTweets().then(parseTweets);
});
