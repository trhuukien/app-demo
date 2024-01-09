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
  FormLayout,
  TextField,
  Select,
  Badge
} from "@shopify/polaris";

import {useState, useCallback, useEffect, useMemo} from 'react';
import { useActionData, useSubmit  } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import {PlusMinor} from '@shopify/polaris-icons';

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    query {
      products(first: 30, reverse: true) {
        edges {
          node {
            id
            title
            handle
            status
            description
          }
        }
      }
    }`,
  );
  const data = await response.json();

  return data.data.products.edges;
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
    mutation {
      productCreate(input: {title: "Sweet new product", productType: "Snowboard", vendor: "JadedPixel"}) {
        product {
          id
        }
      }
    }`,
  );
  const data = await response.json();

  return data;
};

export default function AdditionalPage() {
  const products = useLoaderData();

  const [active, setActive] = useState(false);
  const [currentProduct, setCurrentProduct] = useState();
  const handleOpenPopup = useCallback((id) => {
    setActive(!active);
    const product = products.find(product => product.node.id === id);
    setCurrentProduct(product || undefined);
  }, [active]);

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
        </Layout.Section>
        <Layout.Section>
          {active && (
            <ProductPopup active={active} currentProduct={currentProduct} handleOpenPopup={handleOpenPopup} />
          )}
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
    <IndexTable.Row key={item.node.id}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {item.node.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={item.node.status === "ACTIVE" ? "success" : "warning"}>{item.node.status}</Badge>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Button onClick={() => handleOpenPopup(item.node.id)}>Update</Button>
        <Button variant="primary" tone="critical">Delete</Button>
      </IndexTable.Cell>
    </IndexTable.Row>
    )
  })

  return lines;
}

function ProductPopup({active, currentProduct, handleOpenPopup}) {
  const statusOptions = [
    {label: 'Active', value: 'ACTIVE'},
    {label: 'Draft', value: 'DRAFT'},
    {label: 'Archived', value: 'ARCHIVED'}
  ];
  const [name, setName] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [description, setDescription] = useState('');

  const handleNameChange = useCallback((value) => setName(value), []);
  const handleStatusChange = useCallback((value) => setStatus(value), []);
  const handleDescriptionChange = useCallback((value) => setDescription(value), []);

  useEffect(() => {
    setName(currentProduct ? currentProduct.node.title : '');
    setDescription(currentProduct ? currentProduct.node.description : '');
    setStatus(currentProduct ? currentProduct.node.status : 'DRAFT');
  }, [currentProduct]);


  const actionData = useActionData();
  const submit = useSubmit();
  const handleSaveProduct = () => submit({}, { replace: true, method: "POST" });

  return (
    <div>
      <Frame>
        <Modal
          size="large"
          open={active}
          onClose={handleOpenPopup}
          title={currentProduct ? "Updating | " + currentProduct.node.title : "Create new product"}
          primaryAction={{
            content: 'Save',
            onClick: handleSaveProduct,
            onAction: handleOpenPopup,
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: handleOpenPopup,
            },
          ]}
        >
          <Modal.Section>
          <FormLayout>
            <TextField label="Name" value={name} onChange={handleNameChange} autoComplete="off" />
            <TextField label="Description" value={description} onChange={handleDescriptionChange} multiline={6} autoComplete="off" />
            <FormLayout.Group condensed>
              <Select
                label="Status"
                onChange={handleStatusChange}
                value={status}
                options={statusOptions}
              />
            </FormLayout.Group>
          </FormLayout>
          </Modal.Section>
        </Modal>
      </Frame>
    </div>
  );
}