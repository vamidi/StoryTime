import { InjectionToken } from '@angular/core';
import { IEnvironment } from '@app-core/interfaces/environment.interface';

export const APP_CONFIG = new InjectionToken<IEnvironment>('app.config');
