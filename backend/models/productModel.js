// Simple model - no database, just structure

export default class ProductModel {
    constructor(id, title, description) {
        this.id = id;
        this.title = title;
        this.description = description;
    }
}
