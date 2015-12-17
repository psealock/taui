import debounce from 'debounce'
import React, {Component, PropTypes} from 'react'
import {connect} from 'react-redux'
import Transitive from 'transitive-js'
import TransitiveLayer from 'leaflet-transitivelayer'

import {addActionLogItem, updateMapMarker, updateMap} from '../../actions'
import {fetchGrid, fetchOrigin, fetchQuery, fetchStopTrees, fetchTransitiveNetwork, setAccessibility, setSurface} from '../../actions/browsochrones'
import config from '../../config'
import Fullscreen from '../../components/fullscreen'
import renderMarkers, {mapMarkerConstants} from '../../components/marker-helper'
import Geocoder from '../../components/geocoder'
import Log from '../../components/log'
import Map from '../../components/map'
import styles from './style.css'
import transitiveStyle from './transitive-style'

function printLL (ll) {
  return `[ ${ll[0].toFixed(4)}, ${ll[1].toFixed(4)} ]`
}

/**
 * Callback to be executed on Origin Marker move. Update Browsochones when
 * Marker is dropped
 *
 * @private
 * @param  {Event} e
 */
function onMoveOrigin (e) {
  const marker = this.props.mapMarkers[mapMarkerConstants.ORIGIN]
  if (!marker.isDragging) {
    this.updateBrowsochrones(e)
  }
}

/**
 * Callback to be executed on Destination Marker move.
 *
 * @private
 * @param  {Event} e
 */
function onMoveDestination (e) {
  const marker = this.props.mapMarkers[mapMarkerConstants.DESTINATION]
  if (!marker.isDragging) {
    console.log('drop destination')
  }
}

class Indianapolis extends Component {
  static propTypes = {
    browsochrones: PropTypes.object,
    dispatch: PropTypes.any,
    mapMarker: PropTypes.object,
    map: PropTypes.object
  }

  constructor (props) {
    super(props)
    this.initializeBrowsochrones()

    this.updateBrowsochrones = this.updateBrowsochrones.bind(this)
    this.updateTransitive = debounce(this.updateTransitive, 200, true)
  }

  log (l) {
    this.props.dispatch(addActionLogItem(l))
  }

  initializeBrowsochrones () {
    const {browsochrones, dispatch} = this.props
    const bc = browsochrones.instance
    const grid = 'Jobs_total'

    if (!bc.grid) {
      fetchGrid(`${config.browsochrones.gridsUrl}/${grid}.grid`)(dispatch)
    }

    if (!bc.query) {
      fetchQuery(config.browsochrones.queryUrl)(dispatch)
    }

    if (!bc.stopTrees) {
      fetchStopTrees(config.browsochrones.stopTreesUrl)(dispatch)
    }

    if (!bc.originData && bc.originCoordinates) {
      fetchOrigin(config.browsochrones.originsUrl, bc.originCoordinates)(dispatch)
    }

    if (!bc.transitiveNetwork) {
      fetchTransitiveNetwork(config.browsochrones.transitiveNetworkUrl)(dispatch)
    }
  }

  updateBrowsochrones (event) {
    this.log(`Retrieving isochrones for origin.`)

    const {browsochrones, dispatch} = this.props
    const bc = browsochrones.instance
    const map = getMapFromEvent(event)

    // get the pixel coordinates
    const origin = bc.pixelToOriginCoordinates(map.project(event.latlng || event.target._latlng), map.getZoom())

    if (!bc.coordinatesInQueryBounds(origin)) {
      if (this.isoLayer) {
        map.removeLayer(this.isoLayer)
        this.isoLayer = null
      }
      return
    }

    fetchOrigin(config.browsochrones.originsUrl, origin)(dispatch)
      .then(r => {
        dispatch(setSurface(bc.generateSurface()))
        dispatch(setAccessibility(bc.getAccessibilityForCutoff()))

        if (this.isoLayer) map.removeLayer(this.isoLayer)

        this.isoLayer = window.L.tileLayer.canvas()
        this.isoLayer.drawTile = bc.drawTile.bind(bc)
        this.isoLayer.addTo(map)
      })
      .catch(err => {
        if (this.isoLayer) {
          map.removeLayer(this.isoLayer)
          this.isoLayer = null
        }

        console.error(err)
        console.error(err.stack)
        throw err
      })
  }

  updateTransitive (event) {
    const {browsochrones} = this.props
    const bc = browsochrones.instance

    // If an origin has been retrieved
    if (bc.isLoaded()) {
      const map = getMapFromEvent(event)
      const origin = bc.pixelToOriginCoordinates(map.project(event.latlng), map.getZoom())

      const data = bc.generateTransitiveData(origin)

      if (data.journeys.length > 0) {
        if (!this.transitive) {
          this.transitive = new Transitive({
            data,
            gridCellSize: 200,
            useDynamicRendering: true,
            styles: transitiveStyle
          })
          this.transitiveLayer = new TransitiveLayer(this.transitive)
          map.addLayer(this.transitiveLayer)
          this.transitiveLayer._refresh()
        } else {
          this.transitive.updateData(data)
          this.transitiveLayer._refresh()
        }
      }

      console.log(`Transitive found ${data.journeys.length} unique paths`)
    }
  }

  render () {
    const {browsochrones, dispatch, map, mapMarkers} = this.props
    const {accessibility} = browsochrones
    const originMarker = renderMarkers(mapMarkers, mapMarkerConstants.ORIGIN, dispatch, onMoveOrigin.bind(this))
    const destinationMarker = renderMarkers(mapMarkers, mapMarkerConstants.DESTINATION, dispatch, onMoveDestination.bind(this))

    return (
      <Fullscreen>
        <div className={styles.main}>
          <Map
            className={styles.map}
            map={map}
            onChange={state => dispatch(updateMap(state))}
            onClick={e => {
              const {lat, lng} = e.latlng
              this.log(`Clicked map at ${printLL([lat, lng])}`)

              dispatch(updateMapMarker({
                position: [lat, lng],
                text: ''
              }))
            }}
            onLeafletMouseMove={e => {
              this.updateTransitive(e)
            }}>
            {[originMarker, destinationMarker]}
          </Map>
          <div className={styles.sideBar}>
            <div className={styles.scrollable}>
              <form>
                <fieldset className='form-group' style={{position: 'relative'}}>
                  <legend>Choose an origin</legend>
                  <Geocoder
                    accessToken={config.map.mapbox.accessToken}
                    inputPlaceholder='Search for a start address'
                    onSelect={place => {
                      const [lng, lat] = place.center
                      const position = [lat, lng]

                      dispatch(updateMapMarker({
                        [mapMarkerConstants.ORIGIN]: {
                          isDragging: false,
                          position,
                          text: place.place_name
                        }
                      }))

                      this.log(`Selected: ${place.place_name}`)
                    }}
                    />
                </fieldset>
                <fieldset className='form-group' style={{position: 'relative'}}>
                  <legend>Choose a destination</legend>
                  <Geocoder
                    accessToken={config.map.mapbox.accessToken}
                    inputPlaceholder='Search for an end address'
                    onSelect={place => {
                      const [lng, lat] = place.center
                      const position = [lat, lng]

                      dispatch(updateMapMarker({
                        [mapMarkerConstants.DESTINATION]: {
                          isDragging: false,
                          position,
                          text: place.place_name
                        }
                      }))

                      this.log(`Selected: ${place.place_name}`)
                    }}
                    />
                </fieldset>
              </form>
              <h5>Access</h5>
              <p>{accessibility.toLocaleString()} jobs within 60 minutes.</p>
            </div>

            <div className={styles.navbar}>Indianapolis</div>
            <div className={styles.dockedActionLog}><Log /></div>
          </div>
        </div>
      </Fullscreen>
    )
  }
}

function getMapFromEvent (event) {
  let {_layers, _map} = event.target

  if (_map) return _map

  for (let key in _layers) {
    if (_layers.hasOwnProperty(key) && _layers[key]._map) {
      return _layers[key]._map
    }
  }
}

export default connect(s => s)(Indianapolis)
