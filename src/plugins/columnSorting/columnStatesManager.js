import { isObject, objectEach } from '../../helpers/object';
import { QueuedPhysicalIndexToValueMap as IndexToValueMap } from '../../translations';
import {isDefined} from '../../helpers/mixed';

const inheritedColumnProperties = ['sortEmptyCells', 'indicator', 'headerAction', 'compareFunctionFactory'];

const SORT_EMPTY_CELLS_DEFAULT = false;
const SHOW_SORT_INDICATOR_DEFAULT = true;
const HEADER_ACTION_DEFAULT = true;
const MAP_NAME = 'ColumnStatesManager.sortingStates';

/**
 * Store and manages states of sorted columns.
 *
 * @class ColumnStatesManager
 * @plugin ColumnSorting
 */
// eslint-disable-next-line import/prefer-default-export
export class ColumnStatesManager {
  constructor(hot) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = hot;
    /**
     * Index map storing sorting states for every column. ColumnStatesManager write and read to/from this element.
     *
     * @type {PhysicalIndexToValueMap}
     */
    this.sortingStates = new IndexToValueMap();
    /**
     * Determines whether we should sort empty cells.
     *
     * @type {boolean}
     */
    this.sortEmptyCells = SORT_EMPTY_CELLS_DEFAULT;
    /**
     * Determines whether indicator should be visible (for sorted columns).
     *
     * @type {boolean}
     */
    this.indicator = SHOW_SORT_INDICATOR_DEFAULT;
    /**
     * Determines whether click on the header perform sorting.
     *
     * @type {boolean}
     */
    this.headerAction = HEADER_ACTION_DEFAULT;
    /**
     * Determines compare function factory. Method get as parameters `sortOder` and `columnMeta` and return compare function.
     */
    this.compareFunctionFactory = void 0;

    this.hot.columnIndexMapper.registerMap(MAP_NAME, this.sortingStates);
  }

  /**
   * Update column properties which affect the sorting result.
   *
   * **Note**: All column properties can be overwritten by [columns](https://handsontable.com/docs/Options.html#columns) option.
   *
   * @param {object} allSortSettings Column sorting plugin's configuration object.
   */
  updateAllColumnsProperties(allSortSettings) {
    if (!isObject(allSortSettings)) {
      return;
    }

    objectEach(allSortSettings, (newValue, propertyName) => {
      if (inheritedColumnProperties.includes(propertyName)) {
        this[propertyName] = newValue;
      }
    });
  }

  /**
   * Get all column properties which affect the sorting result.
   *
   * @returns {object}
   */
  getAllColumnsProperties() {
    const columnProperties = {
      sortEmptyCells: this.sortEmptyCells,
      indicator: this.indicator,
      headerAction: this.headerAction
    };

    if (typeof this.compareFunctionFactory === 'function') {
      columnProperties.compareFunctionFactory = this.compareFunctionFactory;
    }

    return columnProperties;
  }

  /**
   * Get sort order of column.
   *
   * @param {number} searchedColumn Visual column index.
   * @returns {string|undefined} Sort order (`asc` for ascending, `desc` for descending and undefined for not sorted).
   */
  getSortOrderOfColumn(searchedColumn) {
    return this.sortingStates.getValueAtIndex(this.hot.toPhysicalColumn(searchedColumn))?.sortOrder;
  }

  /**
   * Get order of particular column in the states queue.
   *
   * @param {number} column Visual column index.
   * @returns {number}
   */
  getIndexOfColumnInSortQueue(column) {
    return this.sortingStates.getIndexesQueue()
      .findIndex(physicalColumn => this.hot.toVisualColumn(physicalColumn) === column);
  }

  /**
   * Get number of sorted columns.
   *
   * @returns {number}
   */
  getNumberOfSortedColumns() {
    return this.sortingStates.getIndexesQueue().length;
  }

  /**
   * Get if list of sorted columns is empty.
   *
   * @returns {boolean}
   */
  isListOfSortedColumnsEmpty() {
    return this.getNumberOfSortedColumns() === 0;
  }

  /**
   * Get if particular column is sorted.
   *
   * @param {number} column Visual column index.
   * @returns {boolean}
   */
  isColumnSorted(column) {
    return isObject(this.sortingStates.getValueAtIndex(this.hot.toPhysicalColumn(column)));
  }

  /**
   * Queue of sort states containing sorted columns and their orders (Array of objects containing `column` and `sortOrder` properties).
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.
   *
   * @returns {Array<object>}
   */
  getSortStates() {
    if (this.sortingStates === null) {
      return [];
    }

    const sortingStatesQueue = this.sortingStates.getEntries();
    const firstSortState = sortingStatesQueue[0];
    const isSortStateObject = isDefined(firstSortState) && isObject(firstSortState[1]);

    if (isSortStateObject === false) {
      return sortingStatesQueue.map(([column, value]) => ({ column: this.hot.toVisualColumn(column), value }));
    }

    return sortingStatesQueue.map(([column, value]) => ({ column: this.hot.toVisualColumn(column), ...value }));
  }

  /**
   * Get sort state for particular column. Object contains `column` and `sortOrder` properties.
   *
   * **Note**: Please keep in mind that returned objects expose **visual** column index under the `column` key.
   *
   * @param {number} column Visual column index.
   * @returns {object|undefined}
   */
  getColumnSortState(column) {
    if (this.isColumnSorted(column)) {
      const physicalColumn = this.hot.toPhysicalColumn(column);

      const sortingStateWithPriority = this.sortingStates.getValueAtIndex(physicalColumn);

      return {
        column,
        sortOrder: sortingStateWithPriority.sortOrder,
      };
    }
  }

  /**
   * Set all column states.
   *
   * @param {Array} sortStates Sort states.
   */
  setSortStates(sortStates) {
    this.sortingStates.clear();

    for (let i = 0; i < sortStates.length; i += 1) {
      this.sortingStates.setValueAtIndex(this.hot.toPhysicalColumn(sortStates[i].column), {
        sortOrder: sortStates[i].sortOrder
      });
    }
  }

  /**
   * Destroy the state manager.
   */
  destroy() {
    this.hot.columnIndexMapper.unregisterMap(MAP_NAME);
    this.sortingStates = null;
  }
}
