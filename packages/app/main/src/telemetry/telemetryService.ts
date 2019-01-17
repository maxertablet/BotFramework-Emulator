//
// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.
//
// Microsoft Bot Framework: http://botframework.com
//
// Bot Framework Emulator Github:
// https://github.com/Microsoft/BotFramwork-Emulator
//
// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License:
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED ""AS IS"", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//

import * as AppInsights from 'applicationinsights';
import { getSettings } from '../settingsData/store';
import { SettingsImpl } from '@bfemulator/app-shared';

const INSTRUMENTATION_KEY = '631faf57-1d84-40b4-9a71-fce28a3934a8';

export class TelemetryService {
  private static _client: AppInsights.TelemetryClient;
  private static _hasStarted: boolean = false;

  public static trackEvent(name: string, properties?: { [key: string]: any }): void {
    if (!this.enabled || !name) {
      return;
    }
    if (!this._client) {
      this.startup();
    }
    this._client.trackEvent({ name, properties });
  }

  private static get enabled(): boolean {
    const settings: SettingsImpl = getSettings() || {} as SettingsImpl;
    const { framework = {} } = settings;
    return framework.collectUsageData;
  }

  private static startup(): void {
    if (!this._hasStarted) {
      AppInsights
        .setup(INSTRUMENTATION_KEY) 
        // turn off extra instrmentation
        .setAutoCollectConsole(false)
        .setAutoCollectDependencies(false)
        .setAutoCollectExceptions(false)
        .setAutoCollectPerformance(false)
        .setAutoCollectRequests(false);
      // do not collect the user's machine name
      AppInsights.defaultClient.context.tags[AppInsights.defaultClient.context.keys.cloudRoleInstance] = '';
      AppInsights.start();

      this._client = AppInsights.defaultClient;
      this._hasStarted = true;
    }
  }
}
