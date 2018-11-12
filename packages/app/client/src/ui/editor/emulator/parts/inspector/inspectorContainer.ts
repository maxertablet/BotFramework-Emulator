import { connect } from 'react-redux';
import { RootState } from '../../../../../data/store';
import { Inspector } from './inspector';
import { CommandServiceImpl } from '../../../../../platform/commands/commandServiceImpl';
import { SharedConstants } from '@bfemulator/app-shared';

const mapStateToProps = (state: RootState, ownProps: any) => {
  const { bot, theme, clientAwareSettings } = state;
  const cwdAsBase = !(clientAwareSettings.cwd || '').startsWith('/') ?
    `/${clientAwareSettings.cwd}` : clientAwareSettings.cwd;
  return {
    ...ownProps,
    botHash: bot.activeBotDigest,
    activeBot: bot.activeBot,
    themeInfo: theme,
    cwdAsBase
  };
};

const mapDispatchToProps = (_dispatch) => {
  return {
    trackEvent: (name: string, properties?: { [key: string]: any }) => {
      CommandServiceImpl.remoteCall(SharedConstants.Commands.Telemetry.TrackEvent, name, properties);
    }
  };
};

export const InspectorContainer = connect(mapStateToProps, mapDispatchToProps)(Inspector);
