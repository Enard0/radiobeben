import * as express from "express";
import { Request, Response } from "express";
import { login_middleware, permissions, permission_middleware } from "../app/permissions";
import { accept_suggestion, add_song, add_suggestion, delete_song, get_authors, get_songs, get_suggestions, reject_suggestion, update_song } from "../app/songs";

const router = express.Router();

router.post("/suggestions", function (req: Request, res: Response) {
    if (req.body.ytid) {
        add_suggestion(req.body.ytid)
            .then(result => {
                res.sendStatus(200);
            })
            .catch(err => {
                res.status(404).send(err);
            })
    } else {
        res.sendStatus(400);
    }
});

router.get("/suggestions", function (req: Request, res: Response) {
    if (req.query.limit && req.query.before && req.query.accepted && req.query.rejected && req.query.waiting) {
        get_suggestions(parseInt(req.query.limit as string), 
        parseInt(req.query.before as string), 
        req.query.accepted as string === "true",
        req.query.rejected as string === "true",
        req.query.waiting as string === "true",
        ).then(result => {
            res.send(result);
        });
    } else {
        res.sendStatus(400);
    }
});

router.put("/suggestions", login_middleware, permission_middleware(permissions.suggestions), function (req: Request, res: Response) {
    if (req.body.status && req.body.id) {
        if (req.body.status == 1) {
            accept_suggestion(req.body.id, req.body.name, req.body.author, req.body.from, req.body.to)
                .then(result => {
                    res.send(result);
                })
                .catch(err => {
                    res.status(404).send(err);
                });
        } else if (req.body.status == -1) {
            reject_suggestion(req.body.id)
                .then(result => {
                    res.send(result);
                })
                .catch(err => {
                    res.status(404).send(err);
                });
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(400);
    }
});

router.get("/library", async function (req: Request, res: Response) {
    if (req.query.limit && req.query.before) {
        let like = "%";
        if (req.query.like) {
            like = req.query.like as string;
        }
        get_songs(req.session.userid, parseInt(req.query.limit as string), parseInt(req.query.before as string), like, req.query.order as string).then(result => {
            res.send(result);
        });
    } else {
        res.sendStatus(400);
    }
});

router.post("/library", login_middleware, permission_middleware(permissions.library), async function (req: Request, res: Response) {
    if (req.body.ytid) {
        add_song(req.body.ytid, req.body.author, req.body.name, req.body.isPrivate)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            res.status(400).send(err);    
        });
    } else {
        res.sendStatus(400);
    }
});

router.put("/library", login_middleware, permission_middleware(permissions.library), async function (req: Request, res: Response) {
    if (req.body.id) {
        update_song(req.body.id, req.body.author, req.body.name, req.body.isPrivate, req.body.globalAuthor)
        .then(result => {
            res.sendStatus(200);
        })
        .catch(err => {
            res.status(400).send(err);
        });
    } else {
        res.sendStatus(400);
    }
});

router.get("/authors", login_middleware, permission_middleware(permissions.library), async function (req: Request, res: Response) {
    if (req.query.limit && req.query.before) {
        let like = "%";
        if (req.query.like) {
            like = req.query.like as string;
        }
        res.send(await get_authors(parseInt(req.query.limit as string), parseInt(req.query.before as string), like));
    } else {
        res.sendStatus(400);
    }
});

router.delete("/song", login_middleware, permission_middleware(permissions.library), async function (req: Request, res: Response) {
    if (req.body.id) {
        await delete_song(req.body.id);
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

export { router as songs }