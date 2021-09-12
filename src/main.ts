import * as express from "express";
import { customQuery, db } from "./helpers/db";
import errorHandler from "./middlewares/errorHandler";
import securityHandler from "./middlewares/securityHandler";
import * as morgan from "morgan";
import PostgrExpress from "./classes/PostgrExpress";
import { PostgrExpressConfig } from "./types/postgrexpress";
import { DB_User } from "./types";

const wrapper = require("express-async-wrapper");

require("dotenv").config();

const PORT = process.env.PORT || 9090;
const app = express();

securityHandler(app);
app.use(express.json());
app.use(morgan(":method :url (:status) :response-time ms"));

app.get(
  "/",
  wrapper(async (req, res) => {
    // const obj = undefined;
    // objectChecker(obj, ["name"]);

    const results = await customQuery<{ user_id: number; username: string }>(
      `SELECT * FROM users`
    );
    return res.json(results);
  })
);
const pge = new PostgrExpress(db);
const config: PostgrExpressConfig = {
  database: {
    tables: [
      {
        tableName: "users",
        routeName: "users",
        primaryKey: "user_id",
        update: {
          fields: [
            {
              name: "username",
              required: true,
            },
          ],
          before: (data: DB_User): DB_User => {
            return {
              ...data,
              username: "New username via express",
            };
          },
          after: (data: DB_User[]) => {
            console.log(`Data updated: ${data[0].username}`);
          },
          idColumn: "username",
        },
        insert: {
          fields: [
            {
              name: "username",
              required: true,
            },
          ],
        },
      },
      {
        tableName: "comments",
        primaryKey: "comment_id",
        update: {
          fields: [],
        },
        insert: {
          fields: [],
        },
      },
    ],
    views: [
      {
        routeName: "user_comments",
        primaryKey: "u.user_id",
        query: `SELECT * FROM users u INNER JOIN comments c ON u.user_id = c.user_id `,
        args: [],
      },
      {
        routeName: "user_comments_minimal",
        primaryKey: "u.user_id",
        query: `SELECT u."username", u."user_id", c."content"  FROM users u INNER JOIN comments c ON u.user_id = c.user_id`,
        args: [],
      },
    ],
  },
};
app.use("/api", pge.PrepareRoute(config));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server Up! Listening On: http://localhost:${PORT}`);
});
