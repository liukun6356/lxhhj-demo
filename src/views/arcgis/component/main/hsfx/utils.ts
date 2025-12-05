import type { Component } from "vue";
import {createApp,h} from "vue"

export function createAndMount(component: Component, props?: any) {
    const instance = createApp(() => h(component, props));
    instance.mount(document.createElement('div'));
    return instance._container.firstElementChild as HTMLDivElement;
}
