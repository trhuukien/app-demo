import {
  Layout,
  Page,
  IndexTable,
  Card,
  useIndexResourceState,
  Text,
  Button,
  useBreakpoints,
  Frame,
  Modal,
  TextContainer
} from "@shopify/polaris";
import {useState, useCallback} from 'react';

import {PlusMinor} from '@shopify/polaris-icons';

export default function AdditionalPage() {
  const products = [
    {
      id: '000000001',
      name: 'Product 1',
      stock_status: 'Instock'
    },
    {
      id: '000000002',
      name: 'Product 2',
      stock_status: 'Instock'
    },
    {
      id: '000000003',
      name: 'Product 3',
      stock_status: 'Instock'
    }
  ];
  const [active, setActive] = useState(false);
  const [currentProduct, setCurrentProduct] = useState();
  const handleOpenPopup = (id) => {
    setActive(!active);
    const product = products.find(product => product.id === id);
    setCurrentProduct(product || undefined);
  };

  return (
    <Page
      fullWidth
      backAction={{content: 'Products', url: '#'}}
      title="Products"
      primaryAction={{content: 'Create product', icon: PlusMinor, onAction: handleOpenPopup}}
      pagination={{
        hasPrevious: true,
        hasNext: true,
      }}
    >
      <Layout>
        <Layout.Section>
          <ProductGrid products={products} handleOpenPopup={handleOpenPopup} />
          {active && <ProductPopup active={active} currentProduct={currentProduct} handleOpenPopup={handleOpenPopup} />}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

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

function ProductLine({products, handleOpenPopup}) {
  const lines = products.map((item) => {
    return (
    <IndexTable.Row key={item.id}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {item.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{item.stock_status}</IndexTable.Cell>
      <IndexTable.Cell>
        <Button onClick={() => handleOpenPopup(item.id)}>Update</Button>
        <Button variant="primary" tone="critical">Delete</Button>
      </IndexTable.Cell>
    </IndexTable.Row>
    )
  })

  return lines;
}

function ProductPopup({active, currentProduct, handleOpenPopup}) {
  return (
    <div>
      <Frame>
        <Modal
          size="large"
          open={active}
          onClose={handleOpenPopup}
          title={currentProduct.name}
          primaryAction={{
            content: 'Add Instagram',
            onAction: handleOpenPopup,
          }}
          secondaryActions={[
            {
              content: 'Learn more',
              onAction: handleOpenPopup,
            },
          ]}
        >
          <Modal.Section>
            <p>
              Use Instagram posts to share your products with millions of
              people. Let shoppers buy from your store without leaving
              Instagram.
            </p>
          </Modal.Section>
        </Modal>
      </Frame>
    </div>
  );
}