/*
* VideoBuffer
* Visit http://createjs.com/ for documentation, updates and examples.
*
* Copyright (c) 2010 gskinner.com, inc.
*
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
*
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
*/

/**
 * @module EaselJS
 */

// namespace:
this.createjs = this.createjs||{};

(function() {
	"use strict";


// constructor:
	/**
	 * When an HTML video seeks, including when looping, there is an indeterminate period before a new frame is available.
	 * This can result in the video blinking or flashing when it is drawn to a canvas. The VideoBuffer class resolves
	 * this issue by drawing each frame to an off-screen canvas and preserving the prior frame during a seek.
	 * 
	 * 	var myBuffer = new createjs.VideoBuffer(myVideo);
	 * 	var myBitmap = new createjs.Bitmap(myBuffer);
	 * 
	 * @class VideoBuffer
	 * @param {HTMLVideoElement} video The HTML video element to buffer.
	 * @constructor
	 **/
	function VideoBuffer(video) {
		
	// private properties:
		/**
		 * Used by Bitmap to determine when the video buffer is ready to be drawn. Not intended for general use.
		 * @property readyState
		 * @protected
		 * @type {Number}
		 * @default 0
		 **/
		this.readyState = video.readyState;
		
		/**
		 * @property _video
		 * @protected
		 * @type {HTMLVideoElement}
		 * @default 0
		 **/
		this._video = video;
		
		/**
		 * @property _canvas
		 * @protected
		 * @type {HTMLCanvasElement}
		 * @default 0
		 **/
		this._canvas = null;
		
		/**
		 * @property _lastTime
		 * @protected
		 * @type {Number}
		 * @default -1
		 **/
		this._lastTime = -1;
		
		if (this.readyState < 2) { video.addEventListener("canplaythrough", this._videoReady.bind(this)); } //once:true isn't supported everywhere, but its a non-critical optimization here.
	}
	var p = VideoBuffer.prototype;
	
	
// public methods:
	/**
	 * BEGIN modifications to fix error with VideoBuffer sometimes returning empty canvas
	 * videoWidth or videoHeight not always set after loadedmetadata event as it is sometimes is set after playback
	 * this may cause a "Passed-in canvas is empty" error 
	 * Also modifying to allow rendering of video poster when not ready
	 * usePoster: enables using the poster attribute to retrieve an image - only valid if a poster attribute is set and the readystate < 2
	 *			if usePoster is a callback function then it will call it with the canvas and poster image as args
	 *			this is used mainly in the VideoObject with copyCanvas for StageGL compatibility
	 * 
	 * Gets an HTML canvas element showing the current video frame, or the previous frame if in a seek / loop.
	 * Primarily for use by {{#crossLink "Bitmap"}}{{/crossLink}}.
	 * @method getImage
	 **/
	p.getImage = function(posterCallback) {
		var canvas=this._canvas, video = this._video;
		if (this.readyState < 2 && !(this.usePoster && video.poster)) { return; }

		if (!canvas || canvas.width == 0 || canvas.height == 0) {
			canvas = this._canvas = createjs.createCanvas?createjs.createCanvas():document.createElement("canvas");
			canvas.width = video.videoWidth;
			canvas.height = video.videoHeight;
		}

		if (video.readyState >= 2) {
			// update buffer otherwise do not update
			if(this._disableSeekBuffering || video.currentTime !== this._lastTime) {
				if(stage.isWebGL) stage.releaseTexture(canvas); // release the previous texture so the animation will "play"
				var ctx = canvas.getContext("2d");
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.drawImage(video,0,0,canvas.width,canvas.height);

				this._lastTime = video.currentTime;
			}
		}
		else if(this.usePoster && video.poster) { // update buffer with a poster image - should always be true if video.readyState < 2
			var img = new Image();
			img.onload = function() {
				var ctx = canvas.getContext("2d");
				ctx.clearRect(0,0,canvas.width,canvas.height);
				ctx.drawImage(img,0,0,canvas.width,canvas.height);

				if(posterCallback) posterCallback(canvas, img);
			};
			img.src = video.poster;
		}

		return canvas;
	};
	
// private methods:
	/**
	 * @method _videoReady
	 * @protected
	 **/
	p._videoReady = function() {
		this.readyState = 2;
	};

	createjs.VideoBuffer = VideoBuffer;
}());
