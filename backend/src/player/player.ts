import { spawn } from "child_process"
import { join } from "path"
import { Between, getManager, getRepository } from "typeorm"
import { secondsToHMS, SQLdatetime } from "../app/datetime"
import { cfg } from "../config/general"
import { Playlist } from "../entity/Playlist"
import { Song } from "../entity/Song"

export default class player {
    ffplay = null
    song = undefined
    playing = false
    song_progress = 0
    counter = undefined
    from_playlist = false
    playlist_id = undefined

    constructor() {
        // start watching for songs to play
        setInterval(this.check_for_song, 1000);
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
        this.ffplay = spawn("ffplay", ["-nodisp", "-autoexit", join(cfg.song_folder, song.filename)]);
        this.song = song;
        if (from_playlist) {
            this.from_playlist = true;
            this.playlist_id = id;
        } else {
            this.from_playlist = false;
            this.playlist_id = undefined;
        }
        this.ffplay.on('spawn', this.song_started);
        this.ffplay.on('close', this.handleClose);
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
        console.log(this.song_progress);
        this.song_progress += 1;
    }

    private song_started = () => {
        console.log("spawned")
        this.counter = setInterval(this.increase_progress, 1000);
        this.playing = true;
    }

    private check_for_song = async () => {
        let result = await getManager().query(
            `SELECT * FROM playlist 
            JOIN song ON song.id = playlist.songId 
            WHERE ? > estTime AND ? < ADDTIME(estTime, SEC_TO_TIME(duration))`,
            [SQLdatetime(new Date()), SQLdatetime(new Date())]
        );
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
                this.play(to_play, true, data.id);
            }
        }
    }
}