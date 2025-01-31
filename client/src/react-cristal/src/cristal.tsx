import * as React from "react";
import * as ReactDOM from "react-dom";
import { Component, ReactNode } from "react";
import {
    Wrapper,
    Header,
    BottomRightResizeHandle,
    RightResizeHandle,
    BottomResizeHandle,
    ContentWrapper,
    padding,
    CloseIcon,
    Title,
    MinimizeIcon,
    ButtonContainer,
} from "./styled";
import { InitialPosition, Size, Coords, isSmartPosition } from "./domain";
import { getCordsFromInitialPosition, getBoundaryCoords } from "./utils";
import { Stacker } from "./stacker";

export interface CristalProps {
    children: ReactNode;
    title?: string;
    initialPosition?: InitialPosition | Coords;
    initialSize?: Size;
    isResizable?: boolean;
    isDraggable?: boolean;
    onClose?: () => void;
    onMove?: (state: CristalState) => void;
    onResize?: (state: CristalState) => void;
    onResizeEnd?: (state: CristalState) => void;
    onMoveEnd?: (state: CristalState) => void;
    className?: string;
    restrictToParentDiv?: boolean;
    onMinimize?: () => void;
    hideHeader?: boolean;
    style?: React.CSSProperties; // Style to be applied to main window div
    wrapperStyle?: React.CSSProperties; // Style applied to the ContentWrapper
    isActive?: boolean;
    onClick?: () => void;
    minSize?: Size;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    hidden?: boolean;
    parentId?: string;
}

export interface CristalState {
    x: number;
    y: number;
    isDragging: boolean;
    isResizingX: boolean;
    isResizingY: boolean;
    zIndex: number;
    width?: number;
    height?: number;
    isMounted: boolean;
    wasActive: boolean;
}

export class Cristal extends Component<CristalProps, CristalState> {
    headerElement?: Element;
    childrenElement?: Element;

    static defaultProps: CristalProps = {
        children: null,
        isResizable: true,
        isDraggable: true,
    };

    state: CristalState = {
        x: padding,
        y: padding,
        isDragging: false,
        isResizingX: false,
        isResizingY: false,
        zIndex: Stacker.getNextIndex(),
        isMounted: false,
        width: this.props.width,
        height: this.props.height,
        wasActive: false,
    };

    componentDidMount() {
        document.addEventListener("mousemove", this.onMouseMove);
        document.addEventListener("mouseup", this.onMouseUp);
        window.addEventListener("resize", this.onWindowResize);
        this.setState({ isMounted: true });
    }

    componentWillUnmount() {
        document.removeEventListener("mousemove", this.onMouseMove);
        document.removeEventListener("mouseup", this.onMouseUp);
        window.removeEventListener("resize", this.onWindowResize);
    }

    componentWillReceiveProps(props: CristalProps) {
        // force a rerender when the width/height/position props change
        if (this.state.width !== props.width) {
            this.setState({ width: props.width });
        }
        if (this.state.height !== props.height) {
            this.setState({ height: props.height });
        }
        if (props.x !== undefined && this.state.x !== props.x) {
            this.setState({ x: props.x });
        }
        if (props.y !== undefined && this.state.y !== props.y) {
            this.setState({ y: props.y });
        }
        if (props.isActive && !this.state.wasActive) {
            this.changeZIndex();
        }
        this.setState({ wasActive: Boolean(props.isActive) });
    }

    // TODO-PERF: debounce
    onWindowResize = () => {
        const { parentId } = this.props;
        const { x, y, width, height } = this.state;
        const size = width && height ? { width, height } : undefined;
        const { x: newX, y: newY } = getBoundaryCoords({ x, y }, size, parentId);

        this.setState({
            x: newX,
            y: newY,
        });
    };

    saveWrapperRef = (el?: Element) => {
        this.childrenElement = el;
        if (!this.childrenElement) return;

        const { initialSize } = this.props;
        let width, height;

        if (initialSize) {
            width = initialSize.width;
            height = initialSize.height;
        } else {
            const rect = this.childrenElement.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
        }

        this.setState({ width, height });
        this.setInitialPosition({ width, height });
    };

    setInitialPosition = (size: Size) => {
        const { initialPosition, parentId } = this.props;
        if (!initialPosition) return;

        let cords;

        if (isSmartPosition(initialPosition)) {
            cords = getCordsFromInitialPosition(initialPosition, size);
        } else {
            cords = initialPosition;
        }

        const { x, y } = getBoundaryCoords(cords, size, parentId);

        this.setState({ x, y });
    };

    snapToPosition = (coords: Coords) => {
        const { x, y } = coords;

        this.setState({ x, y });
    };

    saveHeaderRef = (el: Element) => {
        this.headerElement = el;
    };

    onMouseDown = () => {
        const { isDraggable } = this.props;
        if (!isDraggable) return;

        this.setState({
            isDragging: true,
        });

        if (this.props.onClick) {
            this.props.onClick();
        }
    };

    onMouseMove = (e: MouseEvent) => {
        const { isResizing } = this;
        const {
            isDragging,
            x: currentX,
            y: currentY,
            width: currentWidth,
            height: currentHeight,
        } = this.state;
        const { parentId } = this.props;
        const { movementX, movementY } = e;
        const { innerWidth, innerHeight } = window;
        const newX = currentX + movementX;
        const newY = currentY + movementY;

        if (isDragging) {
            const size =
                currentWidth && currentHeight
                    ? { width: currentWidth, height: currentHeight }
                    : undefined;
            const { x, y } = getBoundaryCoords({ x: newX, y: newY }, size, parentId);

            this.setState({ x, y }, this.notifyMove);

            return;
        }

        if (isResizing) {
            const { isResizingX, isResizingY } = this.state;

            if (isResizingX) {
                const maxWidth = innerWidth - newX - padding;
                const newWidth = (currentWidth || 0) + movementX;
                const width = newWidth > maxWidth ? currentWidth : newWidth;
                this.setState({ width }, this.notifyResize);
            }

            if (isResizingY) {
                const newHeight = (currentHeight || 0) + movementY;
                const maxHeight = innerHeight - newY - padding;
                const height = newHeight > maxHeight ? currentHeight : newHeight;

                this.setState({ height }, this.notifyResize);
            }
        }
    };

    notifyMove = () => {
        const { onMove } = this.props;
        onMove && onMove(this.state);
    };

    notifyResize = () => {
        const { onResize } = this.props;

        if (onResize) {
            onResize(this.state);
        }
    };

    notifyResizeEnd = () => {
        const { onResizeEnd } = this.props;

        if (onResizeEnd) {
            onResizeEnd(this.state);
        }
    };

    notifyMoveEnd() {
        if (this.props.onMoveEnd) this.props.onMoveEnd(this.state);
    }

    get isResizing(): boolean {
        const { isResizingX, isResizingY } = this.state;

        return isResizingX || isResizingY;
    }

    onMouseUp = () => {
        const { isResizingX, isResizingY, isDragging } = this.state;
        if (isResizingX || isResizingY) {
            this.notifyResizeEnd();
        }

        if (isDragging) this.notifyMoveEnd();

        this.setState({
            isDragging: false,
            isResizingX: false,
            isResizingY: false,
        });
    };

    startFullResize = () => {
        // TODO: save cursor before start resizing
        // TODO: reset cursor after finish resizing
        // document.body.style.cursor = 'nwse-resize';

        this.setState({
            isResizingX: true,
            isResizingY: true,
        });
    };

    startXResize = () => this.setState({ isResizingX: true });

    startYResize = () => this.setState({ isResizingY: true });

    get header() {
        const { onClose, isDraggable, onMinimize, isActive, title } = this.props;

        const minimizeIcon = onMinimize ? <MinimizeIcon onClick={onMinimize} /> : null;

        return (
            <Header
                isDraggable={isDraggable}
                innerRef={this.saveHeaderRef}
                onMouseDown={this.onMouseDown}
                isActive={isActive}
            >
                <Title>{title}</Title>
                <ButtonContainer>
                    {minimizeIcon}
                    <CloseIcon onClick={onClose} />
                </ButtonContainer>
            </Header>
        );
    }

    get content() {
        const { children, wrapperStyle } = this.props;
        return <ContentWrapper style={wrapperStyle ? wrapperStyle : {}}>{children}</ContentWrapper>;
    }

    renderResizeHandles = () => {
        const { isResizable } = this.props;
        if (!isResizable) return;
        return [
            <RightResizeHandle key="right-resize" onMouseDown={this.startXResize} />,
            <BottomRightResizeHandle
                key="bottom-right-resize"
                onMouseDown={this.startFullResize}
            />,
            <BottomResizeHandle key="bottom-resize" onMouseDown={this.startYResize} />,
        ];
    };

    changeZIndex = () => {
        const { zIndex } = this.state;
        this.setState({
            zIndex: Stacker.getNextIndex(zIndex),
        });

        if (this.props.onClick) {
            this.props.onClick();
        }
    };

    render() {
        const { isResizing } = this;
        const { x, y, width, height, isDragging, zIndex } = this.state;
        const { className, hideHeader, minSize, style, hidden } = this.props;
        const isActive = isDragging || isResizing;
        const baseStyle = {
            left: x,
            top: y,
            width,
            height,
            zIndex,
        };
        const HeaderComponent = this.header;
        const ContentComponent = this.content;

        const { restrictToParentDiv } = this.props;
        const wrapperDiv = (
            <Wrapper
                style={style || baseStyle}
                innerRef={this.saveWrapperRef}
                isActive={isActive}
                className={className}
                onMouseDown={this.changeZIndex}
                minSize={minSize}
                hidden={hidden}
            >
                {hideHeader ? null : HeaderComponent}
                {ContentComponent}
                {this.renderResizeHandles()}
            </Wrapper>
        );

        if (restrictToParentDiv) {
            return wrapperDiv;
        }

        // TODO: use "visibility"|"opacity" to avoid initial position glitch
        return ReactDOM.createPortal(wrapperDiv, document.body);
    }
}
