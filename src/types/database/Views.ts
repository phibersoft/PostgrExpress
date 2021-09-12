import {DB_User} from "./User";
import {DB_Comment} from "./Comment";

/**
 * SELECT u.user_id, u.username
 * c.comment_id, c.content, c.data
 * FROM users u
 * INNER JOIN comments c
 * ON u.user_id = c.user_id;
 */

export interface DB_VIEW_UserComments extends Pick<DB_User, "user_id" | "username">, Pick<DB_Comment, "comment_id" | "content" | "data"> {
}