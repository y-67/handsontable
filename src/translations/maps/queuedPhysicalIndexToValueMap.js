import IndexMap from './indexMap';
import { getListWithRemovedItems, getListWithInsertedItems } from './utils/physicallyIndexed';
import { getDecreasedIndexes, getIncreasedIndexes } from './utils/actionsOnIndexes';
import { isFunction } from '../../helpers/function';

/**
 * Map for storing mappings from an physical index to a value.
 *
 * Does not update stored values on remove/add row or column action.
 */
class QueuedPhysicalIndexToValueMap extends IndexMap {
  constructor() {
    super();
    this.queueOfIndexes = [];
  }

  /**
   * Add values to list and reorganize.
   *
   * @private
   * @param {number} insertionIndex Position inside the list.
   * @param {Array} insertedIndexes List of inserted indexes.
   */
  insert(insertionIndex, insertedIndexes) {
    this.indexedValues = getListWithInsertedItems(
      this.indexedValues,
      insertionIndex,
      insertedIndexes,
      this.initValueOrFn
    );
    this.queueOfIndexes = getIncreasedIndexes(this.queueOfIndexes, insertedIndexes);

    super.insert(insertionIndex, insertedIndexes);
  }

  /**
   * Remove values from the list and reorganize.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   */
  remove(removedIndexes) {
    this.indexedValues = getListWithRemovedItems(this.indexedValues, removedIndexes);
    this.queueOfIndexes = getDecreasedIndexes(this.queueOfIndexes, removedIndexes);

    super.remove(removedIndexes);
  }

  addQueuedValue(index, value) {
    this.setValueAtIndex(index, value);

    this.queueOfIndexes.push(index);
  }

  removeQueuedValues() {
    if (isFunction(this.initValueOrFn)) {
      this.queueOfIndexes.forEach((physicalIndex) => {
        this.setValueAtIndex(physicalIndex, this.initValueOrFn(physicalIndex));
      });

    } else {
      this.queueOfIndexes.forEach((physicalIndex) => {
        this.setValueAtIndex(physicalIndex, this.initValueOrFn);
      });
    }

    this.queueOfIndexes = [];
  }

  getQueuedValues(indexAsKey) {
    // Include index as part of the value
    if (typeof indexAsKey === 'string') {
      return this.queueOfIndexes.map((physicalIndex) => {
        const value = this.getValueAtIndex(physicalIndex);

        return {
          ...value,
          [indexAsKey]: physicalIndex,
        };
      });
    }

    return this.queueOfIndexes.map(physicalIndex => this.getValueAtIndex(physicalIndex));
  }

  getIndexesQueue() {
    return this.queueOfIndexes;
  }
}

export default QueuedPhysicalIndexToValueMap;
