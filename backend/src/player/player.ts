import { spawn } from "child_process"
import { join } from "path"
import { Between, getConnection, getManager, getRepository } from "typeorm"
import { secondsToHMS, SQLdatetime } from "../app/datetime"
import { cfg } from "../config/general"
import { Playlist } from "../entity/Playlist"
import { Song } from "../entity/Song"
import { Amp, mode } from "./amp"

export default class player {
    private static _instance: player;
    ffplay = null
    song = undefined
    playing = false
    song_progress = 0
    counter = undefined
    from_playlist = false
    playlist_id = undefined
    auto_disable = null;

    amp = null;

    private constructor() {
        // start watching for songs to play
        setInterval(this.check_for_song, 1000);
        this.amp = new Amp();
        if (cfg.stop_on_break_end) {
            this.auto_disable = setInterval(this.check_for_stop, 1000);
        }
    }

    public static get Instance()
    {
        return this._instance || (this._instance = new this());
    }

    check_for_stop = () => {
        if (!this.amp.is_break()) {
            this.stop();
        }
    }

    public set_amp_mode(mode: mode) {
        this.amp.change_mode(mode);
    }

    public get_amp_mode = () => {
        return this.amp.get_mode();
    }

    public play = (song: Song, from_playlist?: boolean, id?: number) => {
        if (!(!this.from_playlist && cfg.playlist_priority) || from_playlist) {
            if (this.playing) {
                this.stop();
                this.ffplay.on('close', () => {
                    this.start(song, from_playlist, id);
                });
            } else {
                this.start(song, from_playlist, id);
            }
            this.playing = true;
        }
    }
    private start = (song: Song, from_playlist?: boolean, id?: number) => {
        console.log("starting")
        if (song.start=0){
            this.ffplay = spawn(process.env.FFPLAY_PATH || "ffplay", ["-nodisp", "-autoexit", join(cfg.song_folder, song.filename)], {stdio: 'ignore'});
        } else {
            this.ffplay = spawn(process.env.FFPLAY_PATH || "ffplay", ["-nodisp", "-autoexit", "-ss"+song.start, join(cfg.song_folder, song.filename)], {stdio: 'ignore'});
        }
        this.song = song;
        if (from_playlist) {
            this.from_playlist = true;
            this.playlist_id = id;
        } else {
            this.from_playlist = false;
            this.playlist_id = undefined;
        }
        this.ffplay.on('spawn', this.song_started);
        //this.ffplay.on('close', this.handleClose);
        this.ffplay.on('exit', this.handleClose);
    }

    public stop = () => {
        if (this.playing) {
            this.ffplay.kill();
        }
    }

    private handleClose = () => {
        this.from_playlist = false;
        this.playlist_id = undefined;
        clearInterval(this.counter);
        this.playing = false;
        this.song = undefined;
        this.song_progress = 0;
    }

    private increase_progress = () => {
        this.song_progress += 1;
    }

    private song_started = () => {
        this.counter = setInterval(this.increase_progress, 1000);
        this.playing = true;
    }

    private check_for_song = async () => {
        let temp_date = new Date();
        temp_date.setSeconds(temp_date.getSeconds() + cfg.time_offset);
        getManager().query(
            `SELECT * FROM playlist 
            JOIN song ON song.id = playlist.songId 
            WHERE ? > estTime AND ? < ADDTIME(estTime, SEC_TO_TIME(duration))`,
            [SQLdatetime(temp_date), SQLdatetime(temp_date)]
        ).then(result => {
            let data = result[0];
            if (data) {
                let to_play = new Song;
                to_play.id = data.songId;
                to_play.ytid = data.ytid;
                to_play.title = data.title;
                to_play.author = data.author;
                to_play.duration = data.duration
                to_play.filename = data.filename;
                to_play.isPrivate = data.isPrivate;
                if (!this.playing || (!this.from_playlist && cfg.playlist_priority)) {
                    if (this.amp.is_break()) {
                        this.play(to_play, true, data.id);
                    }
                }
            }  
        })
        .catch(error => {
            //console.log(error);
        });
    }
}
