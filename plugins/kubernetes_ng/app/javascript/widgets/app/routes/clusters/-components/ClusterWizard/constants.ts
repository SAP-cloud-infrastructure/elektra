export const regionOptions = [
  { value: "eu-de-1", label: "eu-de-1 (Germany)" },
  { value: "eu-de-2", label: "eu-de-2 (Germany)" },
  { value: "eu-nl-1", label: "eu-nl-1 (Netherlands)" },
  { value: "na-us-1", label: "na-us-1 (USA)" },
  { value: "na-us-2", label: "na-us-2 (USA)" },
  { value: "ap-jp-1", label: "ap-jp-1 (Japan)" },
  { value: "ap-au-1", label: "ap-au-1 (Australia)" },
] as const

export const stepDefinitions = [
  { id: "basicInfo", title: "Basic Info" },
  { id: "infrastructure", title: "Infrastructure" },
  { id: "workerNodes", title: "Worker Nodes" },
  { id: "review", title: "Review" },
] as const
