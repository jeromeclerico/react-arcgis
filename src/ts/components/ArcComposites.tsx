import { Promise } from 'es6-promise';
import * as React from 'react';
import { ArcView, BaseProps } from './ArcBase';

interface MapBaseProps extends BaseProps {
  scriptUri: string[];
}

interface WebBaseProps extends BaseProps {
  scriptUri: string[];
  id: string;
}

const eventMap = {
    onClick: 'click',
    onDoubleClick: 'double-click',
    onDrag: 'drag',
    onHold: 'hold',
    onKeyDown: 'key-down',
    onKeyUp: 'key-up',
    onLayerViewCreate: 'layerview-create',
    onLayerViewDestroy: 'layerview-destroy',
    onMouseWheel: 'mouse-wheel',
    onPointerDown: 'pointer-down',
    onPointerMove: 'pointer-move',
    onPointerUp: 'pointer-up',
    onResize: 'resize'
};

export const MapBase = (props: MapBaseProps) => (
  <ArcView
    {...props}
    loadMap={
      ([Map, View], containerId) => {
        const mapData = new Promise((resolve, reject) => {
            const map: __esri.Map = new Map(props.mapProperties);  // Make the map
            const viewProperties: __esri.ViewProperties | __esri.MapProperties = {
                map,
                container: containerId,
                ...props.viewProperties
            };
            const view: __esri.View = new View(viewProperties);  // Make the view
            const typedView = view as __esri.MapView | __esri.SceneView;
            Object.keys(eventMap).forEach((key) => {  // Set view events to any user defined callbacks
                if (props[key]) {
                    typedView.on(eventMap[key], props[key]);
                }
            });
            view.then(() => {
                resolve({ map, view });
            }, (err) => {
                reject(err);
            });
        });
        return mapData;
      }
    }
  />
);

export const WebBase = (props: WebBaseProps) => (
  <ArcView
    {...props}
    loadMap = {
      ([WebConstructor, ViewConstructor, all], containerId) => {
        const mapData = new Promise((resolve, reject) => {
            const map: __esri.WebMap | __esri.WebScene = new WebConstructor({
                portalItem: {
                    id: props.id
                }
            });
            map.load()
                .then(() => map.basemap.load())
                .then(() => {
                    const allLayers = map.allLayers;
                    const promises = allLayers.map((layer) => layer.load());
                    return all(promises.toArray());
                })
                .then((layers) => {
                    const view = new ViewConstructor({
                        container: containerId,
                        map
                    });
                    Object.keys(eventMap).forEach((key) => {  // Set view events to any user defined callbacks
                        if (props[key]) {
                            view.on(eventMap[key], props[key]);
                        }
                    });
                    resolve({ map, view });
                }).otherwise((err) => {
                    reject(err);
                });
        });
        return mapData;
      }
    }
  />
);