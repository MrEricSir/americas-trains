export function buildPopupHTML(props) {
  const isVia = props.provider === 'Via';
  const headerColor = isVia ? '#FFCC00' : (props.iconColor || '#1a73e8');
  const headerText = isVia ? 'color:#003366' : '';

  return `
    <div class="popup-header" style="background:${headerColor};${headerText}">
      ${props.routeName} #${props.trainNum}
    </div>
    <div class="popup-body">
      <div class="row">
        <span class="label">Route</span><br/>
        ${props.origName} (${props.origCode}) → ${props.destName} (${props.destCode})
      </div>
      ${props.lastStaName ? `
      <div class="row">
        <span class="label">Last Station</span><br/>
        ${props.lastStaName} (${props.lastStaCode})
      </div>` : ''}
      ${props.trainTimely ? `
      <div class="row">
        <span class="label">Status</span><br/>
        ${props.trainTimely}
      </div>` : ''}
    </div>
  `;
}
