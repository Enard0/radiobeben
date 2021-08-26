import * as express from "express";
import { Request, Response } from "express";
import { login_middleware, permissions, permission_middleware } from "../app/permissions";
import { add_preset, add_to_playlist, get_playlist, get_presets, get_schedule, set_weekday } from "../app/playlist";
import { Break } from "../types/Time";

const router = express.Router();

declare module 'express-session' {
    interface SessionData {
        userid: number;
    }
}

router.get("/playlist", async function (req: Request, res: Response) {
    if (req.query.date)
        res.send(await get_playlist(new Date(req.query.date as string), req.session.userid));
    else
        res.sendStatus(400);
});

router.post("/playlist", async function (req: Request, res: Response) {
    if (req.body.date && (req.body.breaknumber !== undefined) && req.body.songid) {
        await add_to_playlist(new Date(req.body.date), req.body.breaknumber, req.body.songid, req.session.userid);
        res.sendStatus(200);
    }
    else
        res.sendStatus(400);
});

router.get("/schedule", async function (req: Request, res: Response) {
    if (req.query.date)
        res.send(await get_schedule(new Date(req.query.date as string)));
    else
        res.sendStatus(400);
});

router.put("/schedule", login_middleware, permission_middleware(permissions.schedule), async function (req: Request, res: Response) {
    if (req.body.weekday !== undefined && req.body.isEnabled !== undefined && req.body.isEnabled === false) {
        set_weekday(req.body.weekday, req.body.isEnabled)
            .then(() => {
                res.sendStatus(200);
            })
            .catch(err => {
                res.status(400).send(err);
            })
    } else {
        if (req.body.weekday !== undefined && req.body.isEnabled !== undefined && req.body.breaktimeid !== undefined && req.body.visibility !== undefined) {
            set_weekday(req.body.weekday, req.body.weekday, req.body.breaktimeid, req.body.visibility)
            .then(() => {
                res.sendStatus(200);
            })
            .catch( err => {
                res.status(400).send(err);
            });
        } else {
            res.sendStatus(400);
        }
    }
});

router.get("/breaktimes", login_middleware, permission_middleware(permissions.schedule), async function (req: Request, res: Response) {
    res.send(await get_presets());
});

router.post("/breaktimes", login_middleware, permission_middleware(permissions.schedule), async function (req: Request, res: Response) {
    if (req.body.breaktimes && req.body.name) {
        await add_preset(req.body.name, req.body.breaktimes);
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

export { router as playlist }