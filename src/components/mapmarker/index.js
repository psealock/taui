import log from '../../log'
import React, {Component, PropTypes} from 'react'
import {Marker, Popup} from 'react-leaflet'

/**
 * A set of string constants for Marker types.
 *
 * @public
 * @constant
 * @type {{string:string}}
 */
const TYPES = {
  ORIGIN: 'originMarker',
  DESTINATION: 'destinationMarker'
}

/**
 * On Marker drag start, update position of Marker
 *
 * @private
 * @param  {String} type
 * @param  {Function} dispatch
 * @param  {Event} e
 */
function onLeafletDragStart (type, dispatch, e) {
  const {lat, lng} = e.target._latlng
  const position = [lat, lng]

  dispatch(updateMapMarker({
    [type]: {
      isDragging: true,
      position,
      text: ''
    }
  }))
}

/**
 * On Marker drag end, update position of Marker and setting `isDragging` flag to false
 *
 * @private
 * @param  {String} type
 * @param  {Function} dispatch
 * @param  {Event} e
 */
function onLeafletDragEnd (type, dispatch, e) {
  const {lat, lng} = e.target._latlng
  const position = [lat, lng]
  log(`Dragged marker to ${printLL(position)}`)

  dispatch(updateMapMarker({
    [type]: {
      isDragging: false,
      position,
      text: ''
    }
  }))
}

/**
 * On Marker Move, execute a callback only if the Marker has ended its move
 *
 * @private
 * @param  {String}   type
 * @param  {Object}   marker
 * @param  {Function} callback
 * @param  {Event}   e
 */
function onLeafletMove (type, marker, callback, e) {
  if (!marker.isDragging && callback) {
    callback(e)
  }
}

class MapMarker extends Component {
  static propTypes = {
    dispatch: PropTypes.any.isRequired,
    mapMarkers: PropTypes.object.isRequired,
    onUpdate: PropTypes.func.isRequired,
    type: PropTypes.oneOf([TYPES.ORIGIN, TYPES.DESTINATION])
  }

  render () {
    const {dispatch, mapMarkers, onUpdate, type} = this.props
    const marker = mapMarkers[type]

    return (
      <Marker
        draggable={true}
        position={marker.position}
        onLeafletDragStart={onLeafletDragStart.bind(undefined, type, dispatch)}
        onLeafletDragEnd={onLeafletDragEnd.bind(undefined, type, dispatch)}
        onMove={onLeafletMove.bind(undefined, type, marker, onUpdate)}>
        {marker.text && <Popup><span>{marker.text}</span></Popup>}
      </Marker>
    )
  }
}

const MapMarkerConstants = TYPES
export { MapMarker as default, MapMarkerConstants }