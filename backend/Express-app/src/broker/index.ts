import { config } from '../config';
import { MockBroker } from './mock';
import { Mt5Broker } from './mt5';
import { BrokerAdapter } from './types';

export const mockBroker = new MockBroker();

export const broker: BrokerAdapter = config.broker.mode === 'mt5' ? new Mt5Broker() : mockBroker;

export const isMockBroker = broker === mockBroker;
