import {
  AutoExecutionOptions,
} from "@/lib/priority/auto-execution";
import { buildAutoExecutionAdapterResult } from "@/lib/priority/auto-execution-adapter";
import { buildAutoExecutionSelectorResultFromAdapter } from "@/lib/priority/auto-execution-selectors";
import { CommandCenterAdapterInput } from "@/lib/priority/command-center-adapter";
import AutoExecutionQueue from "@/components/priority/auto-execution-queue";

type AutoExecutionQueueSectionProps = {
  input: CommandCenterAdapterInput;
  options?: AutoExecutionOptions;
  title?: string;
  subtitle?: string;
};

export function AutoExecutionQueueSection({
  input,
  options,
}: AutoExecutionQueueSectionProps) {
  const adapterResult = buildAutoExecutionAdapterResult(input, options);
  const selectorResult = buildAutoExecutionSelectorResultFromAdapter(adapterResult);

  return <AutoExecutionQueue result={selectorResult} />;
}

export default AutoExecutionQueueSection;