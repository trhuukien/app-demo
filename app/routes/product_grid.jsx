import {
    IndexTable,
    Card,
    useIndexResourceState,
    useBreakpoints
} from "@shopify/polaris";

function ProductGrid({products, handleOpenPopup}) {
    const {selectedResources, allResourcesSelected, handleSelectionChange} =
        useIndexResourceState(products);

    return (
        <Card>
        <IndexTable
            condensed={useBreakpoints().smDown}
            itemCount={products.length}
            selectedItemsCount={
            allResourcesSelected ? 'All' : selectedResources.length
            }
            headings={[
            {title: 'Product'},
            {title: 'Status'},
            {title: 'Actions'},
            ]}
        >
            <ProductLine products={products} handleOpenPopup={handleOpenPopup} />
        </IndexTable>
        </Card>
    );
}

export default ProductGrid;