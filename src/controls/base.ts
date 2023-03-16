import { Session } from '../session';

export abstract class ControlInstanceBase<P = unknown, U = unknown> {
  props: P;

  constructor(initialProps: P) {
    this.props = initialProps;
  }

  abstract commitUpdate(updatePayload: U, oldProps: P, newProps: P): void;
}

export abstract class ControlConnectorBase<
  T extends ControlInstanceBase = ControlInstanceBase
> {
  session: Session;
  instances: T[] = [];

  constructor(session: Session) {
    this.session = session;
  }

  abstract addInstance(instance: T): void;
  abstract removeInstance(instance: T): void;
}
