import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import VISTAButton from './VISTAButton';
import { colors, spacing } from '../lib/theme';

export type DatePickerSheetRef = {
  present: (initialValue: Date) => void;
};

type Props = {
  title: string;
  mode?: 'date' | 'datetime' | 'time';
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
};

/**
 * A spinner date picker only ever fires onChange as the user scrolls it —
 * never on "confirm". The screens using a bare `showPicker && <DateTimePicker
 * onChange={(_, d) => { setShowPicker(false); ... }} />` were closing (and
 * committing) on the very first scroll tick, before the user could actually
 * land on a date. This wraps the picker in a real sheet with an explicit
 * Done button; onChange only updates a draft, never dismisses.
 */
const DatePickerSheet = forwardRef<DatePickerSheetRef, Props>(function DatePickerSheet(
  { title, mode = 'date', minimumDate, onConfirm },
  ref
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [draft, setDraft] = useState(new Date());

  useImperativeHandle(ref, () => ({
    present: (initialValue: Date) => {
      setDraft(initialValue);
      sheetRef.current?.present();
    },
  }));

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={mode === 'datetime' ? ['55%'] : ['45%']}
      backdropComponent={(props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />}
    >
      <BottomSheetView style={{ padding: spacing.md, alignItems: 'center' }}>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: spacing.sm }}>{title}</Text>
        <DateTimePicker
          value={draft}
          mode={mode}
          display="spinner"
          minimumDate={minimumDate}
          onChange={(_, d) => {
            if (d) setDraft(d);
          }}
        />
        <View style={{ width: '100%', marginTop: spacing.md }}>
          <VISTAButton
            title="Done"
            variant="accent"
            onPress={() => {
              sheetRef.current?.dismiss();
              onConfirm(draft);
            }}
          />
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

export default DatePickerSheet;
