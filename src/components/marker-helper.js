import log from '../log'
import React, {Component, PropTypes} from 'react'
import {Marker, Popup} from 'react-leaflet'
import {updateMapMarker} from '../actions'

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
 * On Marker Move, execute a callback only if the Marker has ended its move and the
 * callback exists
 *
 * @private
 * @param  {String}   type
 * @param  {Object}   marker
 * @param  {Function} onUpdate
 * @param  {Event}   e
 */
function onLeafletMove (type, marker, onUpdate, e) {
  if (!marker.isDragging && onUpdate) {
    onUpdate(e)
  }
}

/**
 * Helper function for displaying coordinates
 *
 * @priva
 * @param  {Array} ll
 * @return {String}
 */
function printLL (ll) {
  return `[ ${ll[0].toFixed(4)}, ${ll[1].toFixed(4)} ]`
}

/**
 * Create array of markers to be rendered
 *
 * @param  {Object} mapMarkers
 * @param  {Function} onUpdate
 * @param  {Function} dispatch
 * @return {Array}
 */
export default function renderMarkers (mapMarkers, onUpdate, dispatch) {
  return Object.keys(TYPES).map(key => {
    const type = TYPES[key];
    const marker = mapMarkers[type]
    const callback = type === TYPES.ORIGIN ? onUpdate : null

    if (marker && marker.position) {
      return (
        <Marker
          draggable={true}
          key={key}
          position={marker.position}
          onLeafletDragStart={onLeafletDragStart.bind(undefined, type, dispatch)}
          onLeafletDragEnd={onLeafletDragEnd.bind(undefined, type, dispatch)}
          onMove={onLeafletMove.bind(undefined, type, marker, callback)}>
          {marker.text && <Popup><span>{marker.text}</span></Popup>}
        </Marker>
      )
    }
    return null;
  })
}