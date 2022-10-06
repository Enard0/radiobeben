export const cfg = {
    song_folder: "Music", // folder to download songs
    daily_limit: {
        song: 1, // can be null, will be disabled
        author: 2
    },
    weekly_limit: {
        song: 1,
        author: 2
    },
    monthly_limit: {
        song: 2,
        author: 4
    },
    days_in_future: 10,
    playlist_priority: false, // should manualy played song be stopped if it's time for playlist song?
    stop_on_break_end: false, // should song be stopped when break ends?
    time_offset : 0,
    serial_port: "/dev/ttyUSB0",
}
