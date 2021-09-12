/**
 CREATE TABLE comments (
    comment_id integer PRIMARY KEY AUTO INCREMENT,
    user_id integer,
    content varchar(600)
    data json
 )
 */

export interface DB_Comment {
    comment_id: number;
    user_id: number;
    content: string;
    data: Object | null;
}
