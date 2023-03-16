import React from 'react';

export const useButton = ({
  onPress,
  onLongPress,
  onDoublePress,
  onRelease,
  onDoubleRelease,
}: {
  onPress?: () => void;
  onLongPress?: () => void;
  onDoublePress?: () => void;
  onRelease?: () => void;
  onDoubleRelease?: () => void;
}) => {
  const timeoutsRef = React.useRef({
    longPress: 0,
    recentPress: 0,
    recentRelease: 0,
  });

  React.useEffect(() => {
    return () => {
      // cancel timeouts on unmount
      clearTimeout(timeoutsRef.current.longPress);
      clearTimeout(timeoutsRef.current.recentPress);
      clearTimeout(timeoutsRef.current.recentRelease);
    };
  }, []);

  const recentlyPressedRef = React.useRef(false);
  const recentlyReleasedRef = React.useRef(false);
  const hasBeenPressedRef = React.useRef(false);

  const fireButtonEvent = React.useCallback(
    (event: 'pressed' | 'released') => {
      event === 'pressed'
        ? recentlyPressedRef.current
          ? onDoublePress
            ? onDoublePress()
            : onPress && onPress()
          : onPress && onPress()
        : recentlyReleasedRef.current
        ? onDoubleRelease
          ? onDoubleRelease()
          : onRelease && onRelease()
        : hasBeenPressedRef.current && onRelease && onRelease();

      // if there's a pending longPress timeout, press or release should cancel that
      clearTimeout(timeoutsRef.current.longPress);

      if (event === 'pressed') {
        if (!hasBeenPressedRef.current) hasBeenPressedRef.current = true;

        if (onLongPress) {
          timeoutsRef.current.longPress = setTimeout(onLongPress, 500);
        }

        // set recently pressed & schedule reset
        clearTimeout(timeoutsRef.current.recentPress);
        recentlyPressedRef.current = true;
        timeoutsRef.current.recentPress = setTimeout(() => {
          recentlyPressedRef.current = false;
        }, 250);
      } else {
        // set recently released & schedule reset
        clearTimeout(timeoutsRef.current.recentRelease);
        recentlyReleasedRef.current = true;
        timeoutsRef.current.recentRelease = setTimeout(() => {
          recentlyReleasedRef.current = false;
        }, 250);
      }
    },
    [onPress, onLongPress, onDoublePress, onRelease, onDoubleRelease]
  );

  return fireButtonEvent;
};
