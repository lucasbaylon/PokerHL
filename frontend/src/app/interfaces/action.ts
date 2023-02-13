export interface Action {
    id: string;

    type: string;

    display_name: string | undefined;

    color?: {color: string, percent?: number}[];
}
