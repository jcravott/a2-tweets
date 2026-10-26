class Tweet {
	private text:string;
	time:Date;

	constructor(tweet_text:string, tweet_time:string) {
        this.text = tweet_text;
		this.time = new Date(tweet_time);//, "ddd MMM D HH:mm:ss Z YYYY"
	}

	//returns either 'live_event', 'achievement', 'completed_event', or 'miscellaneous'
    get source():string {
        if (/^Watch my\b.*\bright now\b/i.test(this.text)) return 'live_event';
        if (/^(Achieved a new personal record|I just set a goal)\b/i.test(this.text)) return 'achievement';
        if (/^Just (completed|posted)\b/i.test(this.text)) return 'completed_event';
        return 'miscellaneous';
    }

    //returns a boolean, whether the text includes any content written by the person tweeting.
    get written():boolean {
        return this.writtenText.length > 0;
    }

    get writtenText():string {
        //remove shared links/hashtags
        const content = this.text.replace(/https?:\/\/\S+/gi, '')
            .replace(/#Runkeeper\b/gi, '').trim();
        if (this.source === 'completed_event') {
            const separator = content.indexOf(' - ');
            return separator === -1 ? '' : content.slice(separator + 3).trim();
        }
        if (this.source === 'live_event' || this.source === 'achievement' ||
            /^Just linked\b/i.test(content) ||
            /^I just (ran with|completed an activity with)\b/i.test(content)) return '';
        return content;
    }

    get activityType():string {
        if (this.source != 'completed_event') {
            return "unknown";
        }
        //activities may have a distance, a duration, or name with spaces
        const activity = this.text.replace(/^Just (completed|posted)\s+an?\s+/i, '')
            .replace(/^\d+(?:[.,]\d+)?\s*(?:km|mi)\s+/i, '')
            .split(/\s+-\s+|\s+with\s+@?Runkeeper\b|\s+in\s+\d+:|https?:\/\//i)[0]
            .replace(/#Runkeeper\b/gi, '').trim();
        return activity ? activity.toLowerCase() : 'unknown';
    }

    get distance():number {
        if(this.source != 'completed_event') {
            return 0;
        }
        const match = this.text.match(/^Just (?:completed|posted)\s+an?\s+(\d+(?:[.,]\d+)?)\s*(km|mi)\b/i);
        if (!match) return 0;
        const value = Number(match[1].replace(',', '.'));
        return match[2].toLowerCase() === 'km' ? value / 1.609344 : value;
    }

    getHTMLTableRow(rowNumber:number):string {
        //escape text before adding links (to avoid tweets using html)
        const escapeHTML = (value:string):string => value.replace(/[&<>"']/g,
            character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character] || character));
        let end = 0;
        let html = '';
        const urls = /https?:\/\/[^\s<>"']+/gi;
        let match:RegExpExecArray | null;
        while ((match = urls.exec(this.text)) !== null) {
            html += escapeHTML(this.text.slice(end, match.index));
            const url = escapeHTML(match[0]);
            html += `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            end = match.index + match[0].length;
        }
        html += escapeHTML(this.text.slice(end));
        return `<tr><th scope="row">${rowNumber}</th><td>${escapeHTML(this.activityType)}</td><td>${html}</td></tr>`;
    }
}
