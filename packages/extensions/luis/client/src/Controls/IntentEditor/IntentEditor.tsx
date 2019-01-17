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

import * as React from 'react';
import { Component } from 'react';
import { Intent } from '../../Models/Intent';
import { IntentInfo } from '../../Luis/IntentInfo';
import * as styles from './IntentEditor.scss';
import { InspectorHost } from '@bfemulator/sdk-client';

let $host: InspectorHost = (window as any).host;

const TraceIntentStatesKey: string = Symbol('PersistedTraceIntentStates').toString();

enum IntentEditorMode {
  Enabled,
  Disabled,
  Hidden
}

interface TraceIntentState {
  originalIntent: string;
  currentIntent?: string;
}

interface IntentEditorState {
  traceIntentStates: { [key: string]: TraceIntentState };
}

interface IntentEditorProps {
  currentIntent: Intent;
  intentInfo?: IntentInfo[];
  mode: IntentEditorMode;
  traceId: string;
  intentReassigner: (newIntent: string, needsRetrain: boolean) => Promise<void>;
}

class IntentEditor extends Component<IntentEditorProps, IntentEditorState> {

  static getDerivedStateFromProps(nextProps: IntentEditorProps, prevState: IntentEditorState) {
    let currentTraceIntentStates = prevState.traceIntentStates;
    if (nextProps.traceId in currentTraceIntentStates) {
      currentTraceIntentStates[nextProps.traceId].originalIntent = nextProps.currentIntent.intent;
    } else {
      currentTraceIntentStates[nextProps.traceId] = {
        originalIntent: nextProps.currentIntent.intent,
        currentIntent: ''
      };
    }

    return {
      traceIntentStates: currentTraceIntentStates
    };
  }

  constructor(props: any, context: any) {
    super(props, context);
    let persisted = localStorage.getItem(TraceIntentStatesKey);
    let traceIntentStates: { [key: string]: TraceIntentState } = {};
    if (persisted !== null) {
      traceIntentStates = JSON.parse(persisted);
    }
    this.state = {
      traceIntentStates: traceIntentStates
    };
  }

  render() {
    if (!this.props.intentInfo || this.props.mode === IntentEditorMode.Hidden) {
      return (<div id="hidden" className={ styles.hidden }/>);
    } else if (this.props.mode === IntentEditorMode.Disabled) {
      return (
        <div className={ styles.disabled }>
          Please add your LUIS service to enable reassigning.
        </div>
      );
    }
    let options = this.props.intentInfo.map(i => {
      return <option key={ i.id } value={ i.name } label={ i.name }>{ i.name }</option>;
    });

    let currentIntent = this.state.traceIntentStates[this.props.traceId].currentIntent ||
      this.state.traceIntentStates[this.props.traceId].originalIntent;
    return (
      <div className={ styles.intentEditor }>
        <form>
          <label>Reassign Intent</label>
          <select className={ styles.selector } value={ currentIntent } onChange={ this.handleChange }>
            { options }
          </select>
        </form>
      </div>
    );
  }

  private handleChange = (event: React.FormEvent<HTMLSelectElement>) => {
    let newIntent: string = event.currentTarget.value;
    let currentTraceIntentStates = this.state.traceIntentStates;
    let currentIntentState = currentTraceIntentStates[this.props.traceId];
    let needsRetrain: boolean;
    if (newIntent === currentIntentState.originalIntent) {
      currentIntentState.currentIntent = undefined;
      needsRetrain = false;
    } else {
      currentIntentState.currentIntent = newIntent;
      needsRetrain = true;
    }

    this.setAndPersistTraceIntentStates(currentTraceIntentStates);
    if (this.props.intentReassigner) {
      this.props.intentReassigner(newIntent, needsRetrain).catch();
      $host.trackEvent('luis_reassignIntent');
    }
  }

  private setAndPersistTraceIntentStates(states: { [key: string]: TraceIntentState }) {
    this.setState({
      traceIntentStates: states
    });
    localStorage.setItem(TraceIntentStatesKey, JSON.stringify(states));
  }
}

export { IntentEditor, IntentEditorMode };
