/*
 * Copyright (C) 2024 Mats Wahlberg
 *
 * This file is part of The Shattered.
 *
 * The Shattered is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * The Shattered is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See
 * the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with The Shattered. If
 * not, see <https://www.gnu.org/licenses/>. 
 */


//returns random integer in [0,num-1]
function rand_int(num) {
	return Math.floor(Math.random()*num);
}

//picks random element from array
function rand_pick(array) {
	return array[rand_int(array.length)];
}

function unlikely() {
	return (rand_int(10) == 0)
}

const MUSIC_NORMAL=0.5;
const MUSIC_QUIET=0.2;
const MUSIC_TRACKS=[
'music/Jonathan Holmes, Various Artists - Talking to Women about Videogames- The A - 10 It\'s not another ordinary day- Matt Harwood (Bit.Trip, Alien Hominid).mp3',
'music/Jonathan Holmes, Various Artists - Talking to Women about Videogames- The A - 35 Sup Holmes Chiptune magic- LOL Shin Chan.mp3',
'music/Jonathan Holmes, Various Artists - Talking to Women about Videogames- The A - 36 TtWaV NES Tribute- Mike Pugliese.mp3',
'music/Freak Out.mp3']

class DJ {
	//TODO: audio from the start doesn't sound on modern browsers?
	constructor() {
		this.music = new Audio('audio/intro.mp3');
		//this.music = new Audio();
		this.music.volume=0.4;
		this.music.play()

		this.audio = new Audio();
		//this.play('audio/intro.mp3');

		this.fuel=0;
		this.suggestion=-1;
		this.suggestion_part=-1; //TODO: not necessary to define ahead of time?
		this.suggestion_playing=false;
		this.audio_playing=false;
	}

	event_score() {

		//Hmmm... it feels more rewarding to not store fuel, only get new lines right as scoring instead...
		//this.fuel+=1;
		if (!this.suggestion_playing)
			this.fuel+=1;

		this.check_fuel();
	}

	check_fuel() {
		console.log("Fuel: ", this.fuel);
		//wait in case suggestion (override if banter)
		if (this.suggestion_playing) {
			return
		}

		//TODO!
		//override any banter... pause music (or decrease volume)...
		if (this.fuel > 0) {
			this.fuel--;
			//TODO: also if part exceeds max, choose new suggestion
			if (this.suggestion == -1) {
				this.suggestion=rand_int(1)+1;
				this.suggestion_part=1;
			}
			else
				this.suggestion_part++;

			this.suggestion_playing=true;
			this.play('audio/suggestion_'+this.suggestion+'/'+this.suggestion_part+'.mp3')
			//this.music.volume=MUSIC_QUIET;
		}
		else {
			console.log("return")
			//this.music.volume=0.4; //switch back when nothing left...
		}
	}

	event_start() {
		//this.play();
		this.music_start();

		//sometimes play an extra clip at start
		if (unlikely())
			this.play('audio/extra_'+(rand_int(3)+1)+'.mp3')
	}

	event_fail() {
		this.play('audio/gameover_1.mp3');
		this.music_stop();
	}

	event_retry() {
		//this.music.volume=MUSIC_NORMAL;
		this.fuel=0;
		this.suggestion=-1;
		this.suggestion_part=-1;
		this.suggestion_playing=false;
		this.audio_playing=false;

		//normally "Jonathan will ride again", sometimes something else (like when starting)
		if (unlikely())
			this.play('audio/extra_'+(rand_int(3)+1)+'.mp3')
		else
			this.play('audio/retry_1.mp3');
		this.music_start();
	}

	event_newblock(color) {
		//if there's a suggestion playing, do nothing
		if (this.suggestion_playing || this.audio_playing) {
			console.log("no banter")
			return;
		}

		//if nothing going on... how about some random banter?
		if (unlikely()) { //occasional banter
			if (color==3) {
				//if (rand_int(2) == 1)
					this.play('audio/idlecolor_1.mp3');
				//else
					//this.play('audio/idlecolor_2.mp3');
			}
			else if (color==2) {
				this.play('audio/idlecolor_2.mp3');
			}
			else {
				this.play('audio/idlerandom_'+(rand_int(3)+1)+'.mp3')
			}
		}
	}

	//stops any currently playing, starts new
	play(url) {
		console.log("play: ",url);
		this.audio.pause();

		if (url) {
			this.audio_playing=true;

			this.music.volume=MUSIC_QUIET;
			this.audio = new Audio(url);
			this.audio.play();
			this.audio.addEventListener("ended", (event) => {
				this.suggestion_playing=false;
				this.audio_playing=false;
				this.check_fuel();
				this.music.volume=MUSIC_NORMAL;
			});
		}
		else {
			this.audio_playing=false;
			this.suggestion_playing=false;
			this.music.volume=MUSIC_NORMAL;
		}
	}

	//picks random music track (replacing any currently playing) and repeats when it has finished
	music_start() {
		this.music.pause(); //in case (intro) is playing, stop it
		let tmp_vol=this.music.volume; //remember volume (might be lowered)

		//this.music=new Audio(MUSIC_TRACKS[rand_int(MUSIC_TRACKS.length)]);
		this.music=new Audio(rand_pick(MUSIC_TRACKS))
		//this.music=new Audio("music/Jonathan Holmes, Various Artists - Talking to Women about Videogames- The A - 35 Sup Holmes Chiptune magic- LOL Shin Chan.mp3")
		this.music.volume=tmp_vol
		this.music.play();

		this.music.addEventListener("ended", (event) => {
			this.music_start();
		});
	}

	//on game-over
	music_stop() {
		this.music.pause();
	}
}
const dj = new DJ;





const canvas=document.getElementById("canvas");
const div = document.getElementById('bottom-div');
const context=canvas.getContext("2d");


//TODO: READ width+height in field.clear, adapt and update resolutions dynamically
//canvas.width=400;
//canvas.height=800;
context.font="25px Impact";
context.fillText("Loading...", 100, 100);



const state_intro=0;
const state_playing=1;
const state_failed=2;
let game_state=state_intro;



const background=document.getElementById("background");
const blocks=document.getElementById("blocks");


//6x13, with space above
const field_width =6;
const field_height =13;
const detonate_timer=1000;

class Field {
	constructor() {
		this.resize()
		this.clear()
		this.width=canvas.width;
		this.height=canvas.height;
		//canvas.height=window.innerHeight;
		//canvas.width=window.innerWidth;
		//this.block_width=canvas.width/field_width;
		//this.block_height=canvas.height/field_height;
		//canvas.height=canvas.style.height
		console.log("w x: " +canvas.height +" style w: "+ canvas.style.height);

		this.blocks = Array(field_height).fill().map(() => Array(field_width).fill(-1));
		this.blocks_offset = Array(field_height).fill().map(() => Array(field_width).fill(0.5));
		//this.add_block(9, 0, 0);
		//this.add_block(9, 2, 0);
		//this.add_block(9, 4, 0);

		this.target=-1;
		this.timer=0;
	}
	target_type(type) {
		this.target=type;
		this.timer=detonate_timer;
	}
	target_next() {
		this.target=(this.target+1)%4;
		this.timer=detonate_timer;
	}
	resize() {
		canvas.height=this.width=div.clientHeight//*0.95;
		//canvas.width=this.width=div.clientWidth;
		canvas.width=canvas.height*field_width/field_height;

		//canvas.height=window.innerHeight;
		//canvas.width=window.innerWidth;
		this.block_width=canvas.width/field_width;
		this.block_height=canvas.height/field_height;
		//context.clearRect(0,0,canvas.width,canvas.height)
		//context.drawImage(background, 0, canvas.height-canvas.width, canvas.width, canvas.width);
	}
	clear() {
		//canvas.height=window.innerHeight;
		//canvas.width=window.innerWidth;
		//this.block_width=canvas.width/field_width;
		//this.block_height=canvas.height/field_height;
		//context.clearRect(0,0,canvas.width,canvas.height)
		context.fillStyle="#ffffff"
		context.fillRect(0,0,canvas.width,canvas.height)
		context.drawImage(background, 0, canvas.height-canvas.width, canvas.width, canvas.width);
	}
	draw() {
		for (let i=0; i<field_height; ++i) {
			for (let j=0; j<field_width; ++j) {
				if (this.blocks[i][j]!=-1) {
					this.draw_block(i-this.blocks_offset[i][j],j,this.blocks[i][j]);

					if (this.blocks[i][j]==this.target)
						this.draw_block(i-this.blocks_offset[i][j],j,4);
				}
			}
		}

		if (this.timer > 0) {
			context.fillStyle="red";
			context.fillRect(0, this.block_height*(field_height-1+1.5/4), this.block_width*field_width*this.timer/detonate_timer, this.block_height/4);
		}
	}
	is_colliding(row,col){
		//console.log("try x: " +row +"try y: "+ col);
		//console.log("row: " +row +" col: "+ col);
		if (col<0 || col>=field_width)
			return true;
		if (row>=field_height)
			return true;
		if (row<0)
			return false;

		if (this.blocks[row][col] != -1)
			return true;

		return false;
	}
	step(delta) {
		if (this.target != -1) {
			this.timer-=delta;
			if (this.timer<=0) {
				this.remove_target();
				this.remove_lines();
				this.target=-1;
				this.timer=0;
			}
		}

		//(animate) blocks falling down after clearing
		for (let i=0; i<field_height; ++i) {
			for (let j=0; j<field_width; ++j) {
				if (this.blocks_offset[i][j]>0) {
					this.blocks_offset[i][j]-=delta*speed_fast;
					if (this.blocks_offset[i][j]<0)
						this.blocks_offset[i][j]=0

				}
			}
		}
	}
	draw_block(row,col,type) {
		context.drawImage(blocks, type*64, 0, 64, 64, col*this.block_width, row*this.block_height, this.block_width, this.block_height);
	}
	add_block(row,col,type) {
		if (row < 0) {
			if (game_state!=state_failed) {
				game_state=state_failed;
				dj.event_fail();
			}
		}
		else {
			this.blocks[row][col]=type;
			this.blocks_offset[row][col]=0;
		}
	}
	drop_block(old_row, new_row, col) {
		this.blocks[new_row][col]=this.blocks[old_row][col];
		this.blocks_offset[new_row][col]=this.blocks_offset[old_row][col]-(old_row-new_row);
	}
	remove_target() {
		for (let col=0; col<field_width; ++col) {
			let row=field_height-1
			let seek=0;
			for (; row>0; --row) {
				console.log("> row " ,row, " and col" ,col);
				if (this.blocks[row][col]==this.target) {
					console.log("> match");
					this.blocks[row][col]=-1;
					seek=row-1;
					break;
				}
			}
			for (; seek>0; --seek) {
				if (this.blocks[seek][col]==this.target){
				}
				else {
					this.drop_block(seek,row,col)
					row--;
				}
			}
			for (; row>0; --row) {
				this.blocks[row][col]=-1
			}
		}
	}
	check_line(row) {
		let col=0;
		for (; col<field_width; ++col) {
			if (this.blocks[row][col]==-1)
				break;
		}
		return col==field_width
		/*
		if (col==field_width)
			return 1
		else
			return 0
			*/
	}
	remove_lines() {
		//TODO!!!
		let row=field_height-1
		let seek=0;
		for (; row>0; --row) {
			if (this.check_line(row)) {
				console.log("> match row");
				dj.event_score()
				seek=row-1;
				break;
			}
		}

		for (;seek>0; --seek) {
			if (this.check_line(seek)) {
				dj.event_score()
			}
			else {
				for (let col=0; col<field_width; ++col) {
					this.drop_block(seek,row,col)
				}
				row--
			}
		}

		for (; row>0; --row) {
			for (let col=0; col<field_width; ++col) {
				this.blocks[row][col]=-1
			}
		}
		/*
			console.log("> row " ,row, " and col" ,col);
			if (this.blocks[row][col]==this.target) {
				console.log("> match");
				this.blocks[row][col]=-1;
				seek=row-1;
				break;
			}
		}
		for (; seek>0; --seek) {
			if (this.blocks[seek][col]==this.target){
			}
			else {
				this.blocks[row][col]=this.blocks[seek][col]
				row--;
			}
		}
		for (; row>0; --row) {
			this.blocks[row][col]=-1
		}
		*/
	}
	draw_message(title,subtitle) {
		context.fillStyle="rgba(0,255,255,0.4)";
		//context.addColorStop(0, "rgba(255,0,0, 0.5)");  // 50% alpha
		//context.addColorStop(1, "rgba(0,0,255, 0.5)");

		context.fillRect(canvas.width/4, canvas.height/2-20, canvas.width/2 , 25+15+2+4);
		context.fillRect(canvas.width/4-4, canvas.height/2-20, canvas.width/2 +8, 25+15+2+4);
		context.fillRect(canvas.width/4-8, canvas.height/2-20, canvas.width/2 +16, 25+15+2+4);
		context.fillRect(canvas.width/4-12, canvas.height/2-20, canvas.width/2 +24, 25+15+2+4);
		context.textAlign = "center";
		context.fillStyle="rgb(0,0,0)";
		context.font="25px Impact";
		context.fillText(title, canvas.width/2, canvas.height/2-20+25);
		context.font="15px Impact";
		context.fillText(subtitle, canvas.width/2, canvas.height/2-20+25+15);
	}
}

field = new Field;


const speed_slow=0.001;
const speed_fast=0.01;
class FallingBlock {
	constructor(field) {
		this.field=field;
		this.speed=speed_slow;
		this.color=rand_int(4);
		dj.event_newblock(this.color);

		switch (rand_int(3)) {
			case 0: //L
				this.size=2;
				//this.shape=	[true,true,
						//true,false];
				this.shape=	[[true,true],
						[true,false]];
				break;
			case 1: //+
				this.size=3;
				this.shape=	[[false,true,false],
						[true,true,true],
						[false,true,false]];
				//this.shape=	[false,true,false,
						//true,true,true,
						//false,true,false];
						
				break;
			case 2: //U
				this.size=3;
				this.shape=	[[true,false,true],
						[true,true,true],
						[false,false,false]];
				//this.shape=	[true,false,true,
						//true,true,true,
						//false,false,false];
				break;
		}

		this.col=rand_int(field_width-this.size);
		this.row=-this.size;

		let numrot=rand_int(4);
		//console.log(numrot);
		for (let i=0; i<numrot; ++i) {
			//console.log("rot");
			this.rotate()
		}

		//TODO: if U move y++ to cover gap
		if (this.size==3 && this.shape[2][0]==false && this.shape[2][1]==false && this.shape[2][2]==false)
			this.row+=1;
		//TODO: similarly random x margins right and left (for U)
	}

	rotate() {
		if (this.size==2) {
			let newshape=	[[this.shape[1][0], this.shape[0][0]],
					[this.shape[1][1], this.shape[0][1]]];

			if (this.try_change(this.row,this.col,newshape))
				this.shape=newshape;
		} else {
			let newshape=	[[this.shape[2][0], this.shape[1][0], this.shape[0][0]],
					[this.shape[2][1], this.shape[1][1], this.shape[0][1]],
					[this.shape[2][2], this.shape[1][2], this.shape[0][2]]];

			if (this.try_change(this.row,this.col,newshape))
				this.shape=newshape;
		}
	}




	right() {
		if (this.try_change(this.row,this.col+1, this.shape))
			this.col+=1;
	}
	left() {
		if (this.try_change(this.row,this.col-1, this.shape))
			this.col-=1;
	}
	faster() {
		this.speed=speed_fast;
	}
	slower() {
		this.speed=speed_slow;
	}
	step(delta) {
		this.row+=delta*this.speed;
		//console.log("step x: " +this.row +"try y: "+ this.col);
		//TODO: discrete
		if (!this.try_change(this.row,this.col, this.shape)) {
			//this.add_shape(this.row,this.col,this.size,this.shape,this.color)
			this.add_shape()
			return true;
		}
		else {
			return false;
		}
	}

	draw() {
		for (let i=0; i<this.size; ++i) {
			for (let j=0; j<this.size; ++j) {
				if (this.shape[i][j])
					this.field.draw_block(this.row+i,this.col+j,this.color);
			}
		}
	}


	add_shape() {
		//console.log("add shape"+type)
		for (let i=0; i<this.size; ++i) {
			for (let j=0; j<this.size; ++j) {
				if (this.shape[i][j]) {
					this.field.add_block(Math.floor(this.row+i), this.col+j, this.color)
				}
			}
		}
	}

	//TODO: floor vs ceil
	try_change(row,col,shape){
			//console.log("try x: " +row +"try y: "+ col);
		for (let i=0; i<this.size; ++i) {
			for (let j=0; j<this.size; ++j) {
				//console.log("loop i: "+i+" x: "+x);
				if (shape[i][j] && this.field.is_colliding(Math.ceil(row+i), col+j))
					return false;
			}
		}

		//console.log("ok");
		return true;
	}

}




//TMP: for Fluffy
class Cat {
  constructor(name) {
    this.name = name;
	this.foobar=1337;
  }

  speak() {
    console.log(`${this.name} makes a noise.`);
    console.log(`${this.foobar}`);
  }
}

class Lion extends Cat {
  speak() {
    super.speak();
	  this.foobar=1;
    super.speak();
    console.log(`${this.name} roars.`);
  }
}

const l = new Lion("Fuzzy");
l.speak();
//end TMP



//TODO: move into field
let tmp=false;


window.addEventListener("keydown", (event) => {
	if (game_state==state_playing) {
		//console.log(event.key);
		switch (event.key) {
			case "ArrowUp":
				tmp.rotate();
				break;
			case "ArrowRight":
				tmp.right();
				break;
			case "ArrowLeft":
				tmp.left();
				break;
			case "ArrowDown":
				tmp.faster();
				break;
			case "w":
				field.target_type(3);
				break;
			case "a":
				field.target_type(0);
				break;
			case "s":
				field.target_type(1);
				break;
			case "d":
				field.target_type(2);
				break;
			case " ":
				field.target_next();
				break;
		}
	}
	else if (event.key==" ") {
		if (game_state==state_failed) {
			delete field;
			field = new Field;
			tmp = new FallingBlock(field);
			dj.event_retry()
		}
		else {
			tmp=new FallingBlock(field);
			dj.event_start()
		}

		game_state=state_playing
	}
});
window.addEventListener("keyup", (event) => {
		//console.log(ev.key);
		switch (event.key) {
			case "ArrowDown":
				tmp.slower();
				break;
		}
	});


//TODO: not sure about time stamp argument, delta...
let time_old=0;
function loop(time) {
	let delta=time-time_old;
	time_old=time;

	//TODO: resize() should only run on actual window resize/zoom!!!
	field.resize();
	field.clear();
	field.draw();

	//TODO: should be moved into field...
	if (tmp)
		tmp.draw();

	switch (game_state) {
		case state_intro:
			field.draw_message("Welcome!", "Press space to begin")
			break;
		case state_playing:

			field.step(delta);

			if (tmp.step(delta)) {
				//istället direkt i tmp.step()?
				//+field.add(shape...)
				delete tmp;
				tmp=new FallingBlock(field);
				field.remove_lines();
				//dj.event_retry();
			}
			break;
		case state_failed:
			field.draw_message("Game Over!", "Press space to retry")
			break;
	}


	requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
