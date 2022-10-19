import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'actionColor'
})
export class ActionColorPipe implements PipeTransform {

    action_colors = [
        {
            name: "radio_action_0",
            color: "rgb(216, 0, 0)"
        },
        {
            name: "radio_action_1",
            color: "rgb(0, 151, 0)"
        },
        {
            name: "radio_action_2",
            color: "rgb(19, 82, 255)"
        },
        {
            name: "radio_action_3",
            color: "rgb(140, 0, 255)"
        },
        {
            name: "radio_action_4",
            color: "rgb(255, 0, 212)"
        },
        {
            name: "radio_action_5",
            color: "rgb(255, 123, 0)"
        },
        {
            name: "radio_action_6",
            color: "rgb(0, 163, 228)"
        },
    ]

    transform(value: string): string {
        let item = this.action_colors.filter((item: any) => item.name === value);
        return item[0]?.color;
    }

}
