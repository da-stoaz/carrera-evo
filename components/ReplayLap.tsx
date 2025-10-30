import { useMemo, useState } from "react";
import { View } from "react-native";
import { createWorkletRuntime, runOnRuntime } from "react-native-worklets";


export default function ReplayLap() {
    const [isReplaying, setIsReplaying] = useState<boolean>(false);


    const workerRuntime = useMemo(
        () =>
            createWorkletRuntime({
                name: "worker",
                initializer: () => {
                    "worklet";
                    console.log("Initialized worker runtime.")
                }
            }),
        [],
    )

    const replayLap = () => {
        return 0;
    }


    const runReplayOnWorker = () => {
        runOnRuntime(workerRuntime, replayLap)();
    }



    return (
      <View>

      </View>
    )

}