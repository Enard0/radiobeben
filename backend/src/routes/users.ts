import * as express from "express";
import { Request, Response } from "express";
import { login, register } from "../app/users";
import { login_middleware, permissions, permission_middleware } from "../app/permissions";

const router = express.Router();


declare module 'express-session' {
    interface SessionData {
      userid: number;
    }
}

router.post("/login", function (req: Request, res: Response) {
    if (!req.session.userid) {
        if (req.body.login && req.body.password) {
            login(req.body.login, req.body.password)
                .then(id => {
                    req.session.userid = id;
                    res.status(200).send("logged in");
                })
                .catch(err => {
                    res.status(403).send(err);
                });
        } else {
            res.sendStatus(400);
        }
    } else {
        res.status(403).send("already logged in");
    }
});

router.use(login_middleware);

router.post("/register", permission_middleware(permissions.users), function (req: Request, res: Response) {
    if (req.body.login && req.body.password) {
        register(req.body.login, req.body.password).then(result => {
            console.log(result);
            res.sendStatus(200);
        })
            .catch(err => {
                console.log(err);
                res.sendStatus(400);
            })
    } else {
        res.sendStatus(400);
    }
});

router.get("/logout", function (req: Request, res: Response) {
    req.session.destroy(function (err) {
        res.sendStatus(200);
    });
});

export { router as users };