import React, {useRef} from 'react';
import {Animated} from 'react-native';

import {View} from 'components/core';

interface DataGridProps<ItemT, RowT, ColT> {
  data: ItemT[][];
  columnHeaderData: ColT[];
  rowHeaderData: RowT[];

  columnWidths: number[];
  rowHeights: number[];

  renderCell: (renderData: {item: ItemT; rowIndex: number; columnIndex: number}) => React.ReactNode;
  renderRowHeader: (renderData: {item: RowT; rowIndex: number}) => React.ReactNode;
  renderColumnHeader: (renderData: {item: ColT; columnIndex: number}) => React.ReactNode;
  renderCornerHeader: () => React.ReactNode;
}

export function DataGrid<ItemT, RowT, ColT>({
  data,
  columnWidths,
  rowHeights,
  renderCell,
  rowHeaderData,
  renderRowHeader,
  columnHeaderData,
  renderColumnHeader,
  renderCornerHeader,
}: DataGridProps<ItemT, RowT, ColT>) {
  const width = columnWidths.reduce((a, b) => a + b, 0);
  const height = rowHeights.reduce((a, b) => a + b, 0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = rowHeights[0];
  const headerWidth = columnWidths[0];

  return (
    <Animated.ScrollView
      horizontal
      // Setting this to true causes the left side header to move into the content area when overscrolling,
      // no idea why. Would feel better to allow overscroll but I haven't found the problem yet.
      bounces={false}
      style={{width: '100%', height: '100%'}}
      snapToOffsets={columnWidths.slice(1).reduce(
        (accum, width) => {
          accum.push(accum[accum.length - 1] + width);
          return accum;
        },
        [0],
      )}
      onScroll={Animated.event(
        [
          {
            nativeEvent: {
              contentOffset: {
                x: scrollX,
              },
            },
          },
        ],
        {useNativeDriver: true},
      )}
      scrollEventThrottle={1}>
      <Animated.ScrollView
        style={{width: '100%', height: '100%'}}
        snapToOffsets={rowHeights.slice(1).reduce(
          (accum, height) => {
            accum.push(accum[accum.length - 1] + height);
            return accum;
          },
          [0],
        )}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: scrollY,
                },
              },
            },
          ],
          {useNativeDriver: true},
        )}
        scrollEventThrottle={1}>
        <View style={{width: width, height: height}}>
          {data.map((row, rowIndex) =>
            row.map((item, columnIndex) => (
              <View
                key={`${rowIndex}-${columnIndex}`}
                style={{
                  width: columnWidths[columnIndex + 1],
                  height: rowHeights[rowIndex + 1],
                  position: 'absolute',
                  top: rowHeights[0] + rowHeights.slice(1, rowIndex + 1).reduce((a, b) => a + b, 0),
                  left: columnWidths[0] + columnWidths.slice(1, columnIndex + 1).reduce((a, b) => a + b, 0),
                }}>
                {renderCell({item, rowIndex, columnIndex})}
              </View>
            )),
          )}
          <Animated.View
            style={{
              width: width - columnWidths[0],
              height: rowHeights[0],
              position: 'absolute',
              top: 0,
              left: headerWidth,
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              transform: [{translateY: scrollY}],
            }}>
            {columnHeaderData.map((item, columnIndex) => (
              <View
                key={columnIndex}
                style={{
                  width: columnWidths[columnIndex + 1],
                  height: rowHeights[0],
                }}>
                {renderColumnHeader({item, columnIndex})}
              </View>
            ))}
          </Animated.View>
          <Animated.View
            style={{
              width: columnWidths[0],
              height: height - rowHeights[0],
              position: 'absolute',
              top: headerHeight,
              left: 0,
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'stretch',
              transform: [{translateX: scrollX}],
            }}>
            {rowHeaderData.map((item, rowIndex) => (
              <View
                key={rowIndex}
                style={{
                  width: columnWidths[0],
                  height: rowHeights[rowIndex + 1],
                }}>
                {renderRowHeader({item, rowIndex})}
              </View>
            ))}
          </Animated.View>
          <Animated.View
            style={{
              width: headerWidth,
              height: headerHeight,
              position: 'absolute',
              top: 0,
              left: 0,
              transform: [{translateX: scrollX}, {translateY: scrollY}],
            }}>
            {renderCornerHeader()}
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </Animated.ScrollView>
  );
}
