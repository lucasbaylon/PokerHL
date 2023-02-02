export interface Action {
    id: string;

    type: string;

    display_name: string | undefined;

    color?: string;
}
