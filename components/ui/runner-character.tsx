import { useAssets } from "expo-asset";
import React, { useCallback, useEffect, useRef } from "react";
import { View } from "react-native";
import Rive, { Fit, RiveRef } from "rive-react-native";

const STATE_MACHINE = "State Machine 1";
const RUN_INPUT = "Run";

interface RunnerCharacterProps {
  isRunning?: boolean;
  /** When provided, renders the Rive at this pixel size with no container decoration */
  size?: number;
}

export function RunnerCharacter({
  isRunning = false,
  size,
}: RunnerCharacterProps) {
  const [assets, error] = useAssets([require("../../assets/ostrich.riv")]);
  const riveRef = useRef<RiveRef>(null);
  // Keep a ref so the onPlay callback always has the latest value
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  // Set state whenever the prop changes (component already mounted)
  useEffect(() => {
    riveRef.current?.setInputState(STATE_MACHINE, RUN_INPUT, isRunning);
  }, [isRunning]);

  // Set state once Rive has loaded and started playing
  const handlePlay = useCallback(() => {
    riveRef.current?.setInputState(
      STATE_MACHINE,
      RUN_INPUT,
      isRunningRef.current,
    );
  }, []);

  if (error) return null;
  if (!assets) return null;

  const localUri = assets[0].localUri ?? assets[0].uri;

  if (size !== undefined) {
    return (
      <View style={{ width: size, height: size }}>
        <Rive
          ref={riveRef}
          url={localUri}
          fit={Fit.Contain}
          stateMachineName={STATE_MACHINE}
          onPlay={handlePlay}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </View>
    );
  }

  return (
    <View className=" rounded-full overflow-hidden border-4 border-slate-200 shadow-xl mb-10 bg-white">
      <Rive
        ref={riveRef}
        url={localUri}
        fit={Fit.Contain}
        stateMachineName={STATE_MACHINE}
        onPlay={handlePlay}
      />
    </View>
  );
}
