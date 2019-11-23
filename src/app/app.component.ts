import { Component, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

	playlist: any = []; videoId: string;
	videoUrl: SafeUrl; currentVideo: number = 0;
	YT: any; video: any; player: any; reframed: boolean = false;
	constructor(public sanitizer: DomSanitizer,
		private http: HttpClient,
		private changeDetection: ChangeDetectorRef) {
	}

	ngOnInit() {
		if(localStorage.getItem('playlist')) {
			this.playlist = JSON.parse(localStorage.getItem('playlist'))
			this.video = this.playlist[0]['id']
			this.init()
		}
	}

	init() {
		var tag = document.createElement('script')
		tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    window['onYouTubeIframeAPIReady'] = () => this.startVideo();
	}

	startVideo() {
		this.reframed = false
		this.player = new window['YT'].Player('player', {
			videoId: this.video,
			playerVars: {
				autoplay: 1,
				modestBranding: 1,
				controls: 1,
				disablekb: 1,
				rel: 0,
				showinfo: 0,
				fs: 0,
				playsinline: 0
			},
			events: {
				'onStateChange': this.onPlayerStateChange.bind(this),
				'onError': this.onPlayerError.bind(this),
				'onReady': this.onPlayerReady.bind(this)
			}
		})
	}

	onPlayerStateChange(event) {
		switch (event.data) {
			case window['YT'].PlayerState.ENDED:
				console.log('ENDED')
				console.log(this.playlist[this.currentVideo])
				this.removeLink(0);
				this.player.loadVideoById(this.playlist[0]['id'])
				break;

			case window['YT'].PlayerState.PLAYING:
				console.log('PLAYING')
				break;

			case window['YT'].PlayerState.PAUSED:
				console.log('PAUSED')
				break;

			default:
				break;
		}
	}

	onPlayerError(event) {
		console.log(event.data)
	}

	onPlayerReady(event) {
		event.target.playVideo();
	}

	playThis(index) {
  	this.currentVideo = index
  	this.player.loadVideoById(this.playlist[index]['id'])
  }

  addLink(event: ClipboardEvent) {
	  let link = event.clipboardData.getData('text');
  	var expression = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/gm;
		var regex = new RegExp(expression);

		if (link.match(regex)) {
			this.videoId = link.split('?')[1].split('=')[1]
			this.getVideoDetails(this.videoId);
		}
		else {
		  alert("Please paste valid Youtube Video Link ");
		}
  }

  getVideoDetails(id) {
  	this.http.get(`https://www.googleapis.com/youtube/v3/videos?id=${id}&key=AIzaSyBW3ihOUDpO7N8TjWzA3o6ZwqeY-VKkgrs&fields=items(id,snippet(title))&part=snippet,statistics`).subscribe((response) => {
  		let data = {
  			id: id,
  			title: response['items'][0]['snippet']['title']
  		}
  		this.pushNewLink(this.playlist, data)
  		if(this.playlist.length == 1) {
	  		this.video = id
	  		this.init()
  		}
  		localStorage.setItem('playlist', JSON.stringify(this.playlist))
  	}, (error) => {
  		console.log(error)
  	})
  }

  pushNewLink(array, object) {
		const index = array.findIndex((e) => e.id === object.id);
		if(index === -1) array.push(object)
		console.log(array)
  }

  removeLink(index) {
  	this.playlist.splice(index, 1)
  	this.changeDetection.detectChanges();
		localStorage.setItem('playlist', JSON.stringify(this.playlist))
  	console.log(this.playlist);
  }

}
