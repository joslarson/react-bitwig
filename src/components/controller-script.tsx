export type ControllerScriptProps = {
  api: number;
  vendor: string;
  name: string;
  version: string;
  uuid: string;
  author: string;
  midi:
    | { inputs: number; outputs: number }
    | { inputs: string[]; outputs: string[] }
    | { inputs: string[]; outputs: string[] }[];
  children?: React.ReactNode;
};
export const ControllerScript: React.FC<ControllerScriptProps> = (props) => {
  return <>{props.children}</>;
};
