import React from "react";
import { useReducer } from "react";
import { useCallback } from "react";
import { useRef } from "react";
import { forwardRef, useMemo } from "react";
import {
  CommonPhotoAlbumProps,
  ElementRef,
  ForwardedRef,
  JSXElement,
  MasonryPhotoAlbumProps,
  Photo,
  ResponsiveParameter,
  UnstableStaticPhotoAlbum,
  unstable_computeMasonryLayout,
} from "react-photo-album";

type State = [containerWidth?: number, scrollbarWidth?: number];

type Action = [newContainerWidth?: number, newScrollbarWidth?: number];

const breakpoints = Object.freeze([1200, 600, 300, 0]);

function useArray<T>(array: T[] | undefined) {
  const ref = useRef(array);
  if (
    !array ||
    !ref.current ||
    array.length !== ref.current.length ||
    ref.current.some((el, i) => el !== array[i])
  ) {
    ref.current = array;
  }
  return ref.current;
}

function containerWidthReducer(
  state: State,
  [newContainerWidth, newScrollbarWidth]: Action
): State {
  const [containerWidth, scrollbarWidth] = state;

  if (
    containerWidth !== undefined &&
    scrollbarWidth !== undefined &&
    newContainerWidth !== undefined &&
    newScrollbarWidth !== undefined &&
    newContainerWidth > containerWidth &&
    newContainerWidth - containerWidth <= 20 &&
    newScrollbarWidth < scrollbarWidth
  ) {
    // prevent infinite resize loop when scrollbar disappears
    return [containerWidth, newScrollbarWidth];
  }

  return containerWidth !== newContainerWidth ||
    scrollbarWidth !== newScrollbarWidth
    ? [newContainerWidth, newScrollbarWidth]
    : state;
}

function resolveContainerWidth(
  el: HTMLElement | null,
  breakpoints: readonly number[] | undefined
) {
  let width = el?.clientWidth;
  if (width !== undefined && breakpoints && breakpoints.length > 0) {
    const sorted = [...breakpoints.filter((x) => x > 0)].sort((a, b) => b - a);
    sorted.push(Math.floor(sorted[sorted.length - 1] / 2));
    width = sorted.find(
      (breakpoint, index) => breakpoint <= width! || index === sorted.length - 1
    );
  }
  return width;
}

function useContainerWidth(
  ref: ForwardedRef,
  breakpointsArray: number[] | undefined,
  defaultContainerWidth?: number
) {
  const [[containerWidth], dispatch] = useReducer(containerWidthReducer, [
    defaultContainerWidth,
  ]);
  const breakpoints = useArray(breakpointsArray);
  const observerRef = useRef<ResizeObserver>();

  const containerRef = useCallback(
    (node: HTMLElement | null) => {
      observerRef.current?.disconnect();
      observerRef.current = undefined;

      const updateWidth = () =>
        dispatch([
          resolveContainerWidth(node, breakpoints),
          window.innerWidth - document.documentElement.clientWidth,
        ]);

      updateWidth();

      if (node && typeof ResizeObserver !== "undefined") {
        observerRef.current = new ResizeObserver(updateWidth);
        observerRef.current.observe(node);
      }

      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        // eslint-disable-next-line no-param-reassign
        ref.current = node;
      }
    },
    [ref, breakpoints]
  );

  return { containerRef, containerWidth };
}
function unwrap<
  Value,
  Arg,
  Return = Value extends (args: any) => unknown ? ReturnType<Value> : Value
>(value: Value, arg: Arg): Return {
  return typeof value === "function" ? value(arg) : value;
}
function unwrapParameter<Value>(
  value: ResponsiveParameter<Value> | undefined,
  containerWidth: number | undefined
): Value | undefined {
  return containerWidth !== undefined
    ? unwrap(value, containerWidth)
    : undefined;
}

function selectResponsiveValue(
  values: ResponsiveParameter[],
  containerWidth: number
) {
  const index = breakpoints.findIndex(
    (breakpoint) => breakpoint <= containerWidth
  );
  return unwrap(values[Math.max(index, 0)], containerWidth);
}

function resolveResponsiveParameter(
  parameter: ResponsiveParameter | undefined,
  containerWidth: number | undefined,
  values: ResponsiveParameter[],
  minValue = 0
) {
  if (containerWidth === undefined) return undefined;
  const value = unwrapParameter(parameter, containerWidth);
  return Math.round(
    Math.max(
      value === undefined
        ? selectResponsiveValue(values, containerWidth)
        : value,
      minValue
    )
  );
}

function resolveCommonProps<TPhoto extends Photo>(
  containerWidth: number | undefined,
  {
    spacing,
    padding,
    componentsProps,
    render,
  }: Pick<
    CommonPhotoAlbumProps<TPhoto>,
    "spacing" | "padding" | "componentsProps" | "render"
  >
) {
  return {
    spacing: resolveResponsiveParameter(
      spacing,
      containerWidth,
      [20, 15, 10, 5]
    ),
    padding: resolveResponsiveParameter(padding, containerWidth, [0, 0, 0, 0]),
    componentsProps: unwrap(componentsProps, containerWidth) || {},
    render: unwrap(render, containerWidth),
  };
}
function resolveMasonryProps<TPhoto extends Photo>(
  containerWidth: number | undefined,
  { columns, ...rest }: MasonryPhotoAlbumProps<TPhoto>
) {
  return {
    ...rest,
    ...resolveCommonProps(containerWidth, rest),
    columns: resolveResponsiveParameter(
      columns,
      containerWidth,
      [5, 4, 3, 2],
      1
    ),
  };
}

function MasonryPhotoAlbum<TPhoto extends Photo>(
  {
    photos,
    breakpoints,
    defaultContainerWidth,
    ...rest
  }: MasonryPhotoAlbumProps<TPhoto>,
  ref: ForwardedRef
) {
  const { containerRef, containerWidth } = useContainerWidth(
    ref,
    breakpoints,
    defaultContainerWidth
  );

  const { spacing, padding, columns, ...restProps } = resolveMasonryProps(
    containerWidth,
    { photos, ...rest }
  );

  const model = useMemo(
    () =>
      containerWidth !== undefined &&
      spacing !== undefined &&
      padding !== undefined &&
      columns !== undefined
        ? unstable_computeMasonryLayout(
            photos,
            spacing,
            padding,
            containerWidth,
            columns
          )
        : undefined,
    [photos, spacing, padding, containerWidth, columns]
  );

  return (
    <UnstableStaticPhotoAlbum
      layout="masonry"
      ref={containerRef}
      model={model}
      {...restProps}
    />
  );
}

export default forwardRef(MasonryPhotoAlbum) as <TPhoto extends Photo>(
  props: MasonryPhotoAlbumProps<TPhoto> & ElementRef
) => JSXElement;
