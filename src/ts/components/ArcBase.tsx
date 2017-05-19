import { esriPromise } from 'esri-promise';
import * as React from 'react';
import ArcContainer from './ArcContainer';

export interface BaseProps {
    className?: string;
    style?: {
        [propName: string]: any
    };
    mapProperties?: __esri.MapProperties;
    viewProperties?: __esri.MapViewProperties | __esri.SceneViewProperties;
    onClick?: (e: EventProperties) => any;
    onDoubleClick?: (e: EventProperties) => any;
    onDrag?: (e: EventProperties) => any;
    onHold?: (e: EventProperties) => any;
    onKeyDown?: (e: EventProperties) => any;
    onKeyUp?: (e: EventProperties) => any;
    onLayerViewCreate?: (e: EventProperties) => any;
    onLayerViewDestroy?: (e: EventProperties) => any;
    onMouseWheel?: (e: EventProperties) => any;
    onPointerDown?: (e: EventProperties) => any;
    onPointerMove?: (e: EventProperties) => any;
    onPointerUp?: (e: EventProperties) => any;
    onResize?: (e: EventProperties) => any;
    onLoad?: (map: __esri.Map, view: __esri.MapView | __esri.SceneView) => any;
    onFail?: (e: any) => any;
    loadComponent?: any;
    failComponent?: any;
}

interface ArcProps extends BaseProps {
    scriptUri: string[];
}

interface EventProperties {
    [propName: string]: any;
}


interface ComponentState {
    map: __esri.Map;
    mapContainerId: string;
    mapProperties: __esri.MapProperties;
    view: __esri.MapView | __esri.SceneView;
    viewProperties: __esri.MapViewProperties | __esri.SceneViewProperties;
    status: string;
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

export class ArcView extends React.Component<ArcProps, ComponentState> {
    constructor(props) {
        super(props);
        this.state = {
            map: null,
            mapContainerId: Math.random().toString(36).substring(0, 14),
            mapProperties: this.props.mapProperties,
            status: 'loading',
            view: null,
            viewProperties: this.props.viewProperties
        }
        this.renderMap = this.renderMap.bind(this);
    }

    public render() {
        const centerStyle = {
            left: '50%',
            marginRight: '-50%',
            position: 'absolute',
            top: '50%',
            transform: 'translate(-50%, -50%)'
        };
        const mapStyle = this.props.className ? this.props.style : { position: 'relative', width: '100%', height: '100%', ...this.props.style };
        const className = this.props.className ? this.props.className : null;
        const loadElement = (this.props.loadComponent ? <this.props.loadComponent /> : <h3 style={centerStyle as any}>Loading..</h3>);
        const failElement = (
            this.props.failComponent ? <this.props.failComponent /> :
            <h3 style={centerStyle as any}>The ArcGIS API failed to load.</h3>
        );
        if (this.state.status === 'loaded') {
            const childrenWithProps = React.Children.map(this.props.children, (child) => {
                const childEl = child as React.ReactElement<any>;
                return React.cloneElement(childEl, {
                        map: this.state.map,
                        view: this.state.view
                    }
                );
            });
            return (
                <div style={mapStyle} className={className}>
                    <ArcContainer id={this.state.mapContainerId} style={{ width: '100%', height: '100%' }} />
                    {childrenWithProps}
                </div>
            );
        } else if (this.state.status === 'loading') {
            return (
                <div style={mapStyle} className={className}>
                    <ArcContainer id={this.state.mapContainerId} style={{ width: '100%', height: '100%' }} />
                    {loadElement}
                </div>
            );
        }
        return (
            <div style={mapStyle} className={className}>
                {failElement}
            </div>
        );
    }

    private componentDidMount() {
        esriPromise(this.props.scriptUri)
        .then(([
            Map, View
        ]) => {
            this.renderMap(Map, View)
                .then(
                    () => {
                        this.setState({ status: 'loaded' });
                        if (this.props.onLoad) {
                            this.props.onLoad(this.state.map, this.state.view);
                        }
                    },
                    (e) => {
                        throw e;
                    });
        }).catch((e) => {
            this.setState({ status: 'failed' });
            if (this.props.onFail) {
                this.props.onFail(e);
            }
        });
    }

    private renderMap(Map: __esri.MapConstructor, View: __esri.ViewConstructor) {
        const map: __esri.Map = new Map(this.props.mapProperties);  // Make the map
        const viewProperties: __esri.ViewProperties | __esri.MapProperties = {
            map,
            container: this.state.mapContainerId,
            ...this.props.viewProperties
        }
        const view: __esri.View = new View(viewProperties);  // Make the view
        const typedView = view as __esri.MapView | __esri.SceneView;
        Object.keys(eventMap).forEach((key) => {  // Set view events to any user defined callbacks
            if (this.props[key]) {
                typedView.on(eventMap[key], this.props[key]);
            }
        });
        this.setState({
            map,
            view: typedView
        });
        return view;
    }

    private componentWillReceiveProps(nextProps: BaseProps) {
        Object.keys(nextProps.mapProperties).forEach((key) => {
            if (this.state.map.get(key) && this.state.map.get(key) !== nextProps.mapProperties[key]) {
                this.state.map.set(key, nextProps.mapProperties[key]);
            }
        });
        Object.keys(nextProps.viewProperties).forEach((key) => {
            if (this.state.view.get(key) && this.state.view.get(key) !== nextProps.viewProperties[key]) {
                const changes = {};
                changes[key] = nextProps.viewProperties[key];
                this.state.view.set(changes);
            }
        });
    }
}
