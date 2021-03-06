import fetch from 'isomorphic-fetch'
import {stringify} from 'qs'
import {createAction} from 'redux-actions'

export const ADD_ACTION_LOG_ITEM = 'ADD_ACTION_LOG_ITEM'
export const addActionLogItem = createAction(ADD_ACTION_LOG_ITEM, (item) => {
  const payload = typeof item === 'string'
    ? { text: item }
    : item

  return Object.assign({
    createdAt: new Date(),
    level: 'info'
  }, payload)
})

export const UPDATE_MAP_MARKER = 'UPDATE_MAP_MARKER'
export const updateMapMarker = createAction(UPDATE_MAP_MARKER)

export const UPDATE_MAP = 'UPDATE_MAP'
export const updateMap = createAction(UPDATE_MAP)

export const UPDATE_SELECTED_DESTINATION = 'UPDATE_SELECTED_DESTINATION'
export const updateSelectedDestination = createAction(UPDATE_SELECTED_DESTINATION)

export const UPDATE_SELECTED_PROJECT = 'UPDATE_SELECTED_PROJECT'
export const updateSelectedProject = createAction(UPDATE_SELECTED_PROJECT)

export const UPDATE_SELECTED_TRANSIT_MODE = 'UPDATE_SELECTED_TRANSIT_MODE'
export const updateSelectedTransitMode = createAction(UPDATE_SELECTED_TRANSIT_MODE)

export const UPDATE_SELECTED_TRANSIT_SCENARIO = 'UPDATE_SELECTED_TRANSIT_SCENARIO'
export const updateSelectedTransitScenario = createAction(UPDATE_SELECTED_TRANSIT_SCENARIO)

export const REQUEST_SINGLE_POINT = 'REQUEST_SINGLE_POINT'
export const requestSinglePoint = createAction(REQUEST_SINGLE_POINT)

export const RECEIVE_SINGLE_POINT = 'RECEIVE_SINGLE_POINT'
export const receiveSinglePoint = createAction(RECEIVE_SINGLE_POINT)

export function fetchSinglePoint (query) {
  return function (dispatch) {
    dispatch(requestSinglePoint(query))

    const qs = stringify({
      lat: query.position[0],
      lng: query.position[1],
      destinationPointsetId: query.destinationPointsetId,
      graphId: query.graphId
    })

    return fetch(`/api/singlePointRequest?${qs}`)
      .then(response => response.json())
      .then(json => dispatch(receiveSinglePoint(json)))
      .catch(e => console.error(e))
  }
}
