import { isUndefined } from '../helpers/mixed';
import { mixin } from '../helpers/object';
import localHooks from '../mixins/localHooks';

class MapCollection {
  constructor(entries = []) {
    this.mappings = new Map(entries);
  }

  /**
   * Register custom indexes map.
   *
   * @param {String} name Unique name of the indexes list.
   * @param {BaseMap} map Map containing miscellaneous (i.e. meta data, indexes sequence), updated after remove and insert data actions.
   * @returns {BaseMap|IndexMap}
   */
  register(name, map) {
    if (this.mappings.has(name) === false) {
      this.mappings.set(name, map);
    }

    map.addLocalHook('mapChanged', () => this.runLocalHooks('collectionChanged'));

    return this.mappings.get(name);
  }

  /**
   * Get indexes list by it's name.
   *
   * @param {String} name Name of the indexes list.
   * @returns {IndexMap}
   */
  get(name) {
    if (isUndefined(name)) {
      return this.mappings.values();
    }

    return this.mappings.get(name);
  }

  /**
   * Update indexes after removing some indexes.
   *
   * @private
   * @param {Array} removedIndexes List of removed indexes.
   * @param {Boolean} [silent=false] Should notify listeners
   */
  updateIndexesAfterRemoval(removedIndexes, silent = false) {
    this.mappings.forEach((list) => {
      list.removeValuesAndReorganize(removedIndexes, true);
    });

    if (silent !== true) {
      this.runLocalHooks('collectionChanged');
    }
  }

  /**
   * Update indexes after inserting new indexes.
   *
   * @private
   * @param {Number} insertionIndex First inserted visual index.
   * @param {Number} insertedIndexes First inserted physical index.
   * @param {Boolean} [silent=false] Should notify listeners
   */
  updateIndexesAfterInsertion(insertionIndex, insertedIndexes, silent = false) {
    this.mappings.forEach((list) => {
      list.addValueAndReorganize(insertionIndex, insertedIndexes);
    });

    if (silent !== true) {
      this.runLocalHooks('collectionChanged');
    }
  }

  /**
   * Reset current index map and create new one.
   *
   * @param {Number} length Custom generated map length.
   * @param {Boolean} [silent=false] Should notify listeners
   */
  initToLength(length, silent = false) {
    this.mappings.forEach((list) => {
      list.init(length);
    });

    if (silent !== true) {
      this.runLocalHooks('collectionChanged');
    }
  }
}

mixin(MapCollection, localHooks);

export default MapCollection;
