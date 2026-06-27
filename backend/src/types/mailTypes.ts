export type ForwardingEmail = {
    id?: number;
    destination_email: string;
}

export type Alias = {
    id?: number;
    alias_email: string;
}

export type AutoReply = {
    id: number;
    subject: string;
    message: string;
    enabled?: boolean;
    days?: number;
}
