let written_tweets = [];

function parseTweets(runkeeper_tweets) {
	//Do not proceed if no tweets loaded
    if (runkeeper_tweets === undefined) {
        window.alert('No tweets returned');
        return;
    }
    //keep OG dataset number when filtering/changing queries
    written_tweets = runkeeper_tweets.map((tweet, index) => ({
        tweet: new Tweet(tweet.text, tweet.created_at), number: index + 1
    })).filter(entry => entry.tweet.written);
    updateSearch();
}

function updateSearch() {
    const text = document.getElementById('textFilter').value;
    const query = text.toLowerCase();
    const matches = query.length ? written_tweets.filter(entry =>
        entry.tweet.writtenText.toLowerCase().includes(query)) : [];
    document.getElementById('searchText').textContent = text;
    document.getElementById('searchCount').textContent = matches.length;
    document.getElementById('tweetTable').innerHTML = matches.map(entry =>
        entry.tweet.getHTMLTableRow(entry.number)).join('');
}

function addEventHandlerForSearch() {
    document.getElementById('textFilter').addEventListener('input', updateSearch);
    updateSearch();
}

//Wait for the DOM to load
document.addEventListener('DOMContentLoaded', function () {
    addEventHandlerForSearch();
    loadSavedRunkeeperTweets().then(parseTweets);
});
