import { createWidget } from 'widget'
import * as reducers from './reducers';
import App from './components/application';

createWidget(__dirname).then((widget) => {
  widget.configureAjaxHelper({
    baseURL: widget.config.scriptParams.keppelApi,
    headers: { 'X-Auth-Token': widget.config.scriptParams.token },
  })

  //convert params from strings into the respective types
  widget.config.scriptParams.canEdit = widget.config.scriptParams.canEdit == 'true';
  widget.config.scriptParams.isAdmin = widget.config.scriptParams.isAdmin == 'true';
  widget.config.scriptParams.dockerInfo = {
    userName: widget.config.scriptParams.dockerCliUsername,
    registryDomain: (new URL(widget.config.scriptParams.keppelApi)).hostname,
  };

  //delete params that React does not consume
  delete(widget.config.scriptParams.keppelApi);
  delete(widget.config.scriptParams.token);
  delete(widget.config.scriptParams.dockerCliUsername);

  widget.setPolicy();
  widget.createStore(reducers);
  widget.render(App);
})
