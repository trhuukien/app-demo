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
  Badge,
  Banner
} from "@shopify/polaris";

import {useState, useCallback, useEffect} from 'react';
import { useActionData, useNavigation, useSubmit  } from "@remix-run/react";
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
            descriptionHtml
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
  const formData = await request.formData();

  if (formData.get("idDelete")) {
    const response = await admin.graphql(
      `#graphql
      mutation productDelete($input: ProductDeleteInput!) {
        productDelete(input: $input) {
          deletedProductId
        }
      }`,
      {
        variables: {
          input: {
            id: `${formData.get("idDelete")}`,
          },
        },
      }
    );

    const responseJson = await response.json();
    return responseJson;
  } else if (formData.get("id")) { // Update product
    const response = await admin.graphql(
      `#graphql
      mutation populateProduct($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            descriptionHtml
            status
          }
        }
      }`,
      {
        variables: {
          input: {
            id: `${formData.get("id")}`,
            title: `${formData.get("name")}`,
            descriptionHtml: `${formData.get("descriptionHtml")}`,
            status: `${formData.get("status")}`,
          },
        },
      }
    );

    const responseJson = await response.json();
    return responseJson;
  } else { // Create product
    const response = await admin.graphql(
      `#graphql
      mutation populateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            title
            descriptionHtml
            status
          }
        }
      }`,
      {
        variables: {
          input: {
            title: `${formData.get("name")}`,
            descriptionHtml: `${formData.get("descriptionHtml")}`,
            status: `${formData.get("status")}`,
          },
        },
      }
    );

    const responseJson = await response.json();
    return responseJson;
  }

  return null;
};

export default function AdditionalPage() {
  const products = useLoaderData();

  const [active, setActive] = useState(false);
  const [currentProduct, setCurrentProduct] = useState();
  const handleOpenPopup = useCallback((id) => {
    setActive(!active);
    const product = products.find(product => product.node.id === id);
    setCurrentProduct(product || undefined);
  }, [active, products]);

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
  const submit = useSubmit();
  const handleDeleteProduct = useCallback((id) => {
    let formData = new FormData();
    formData.set("idDelete", id);
    submit(formData, { replace: true, method: "POST" });
  }, []);

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
        <Button onClick={() => handleDeleteProduct(item.node.id)} variant="primary" tone="critical">Delete</Button>
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
  const [descriptionHtml, setDescriptionHtml] = useState('');
  const [inValid, setInValid] = useState(false);

  const handleNameChange = useCallback((value) => setName(value), []);
  const handleStatusChange = useCallback((value) => setStatus(value), []);
  const handleDescriptionHtmlChange = useCallback((value) => setDescriptionHtml(value), []);

  useEffect(() => {
    setName(currentProduct ? currentProduct.node.title : '');
    setDescriptionHtml(currentProduct ? currentProduct.node.descriptionHtml : '');
    setStatus(currentProduct ? currentProduct.node.status : 'DRAFT');
  }, [currentProduct]);

  const nav = useNavigation();
  const actionData = useActionData();
  const submit = useSubmit();
  const handleSaveProduct = () => {
    if (name === '') {
      setInValid(true);
      return;
    }
    setInValid(false);

    let formData = new FormData();
    formData.set("id", currentProduct ? currentProduct.node.id : '');
    formData.set("name", name);
    formData.set("descriptionHtml", descriptionHtml);
    formData.set("status", status);
    submit(formData, { replace: true, method: "POST" });
  };

  useEffect(() => {
    if (nav.state === "loading" && actionData) {
      handleOpenPopup();
    }
  }, [nav.state, actionData]);

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
            onClick: handleSaveProduct
          }}
          secondaryActions={[
            {
              content: 'Cancel',
              onAction: handleOpenPopup
            }
          ]}
        >
          <Modal.Section>
          {inValid && (
            <Banner
              title="Please enter name product."
              tone="warning"
            />
          )}
          
          <FormLayout>
            <TextField label="Name" value={name} onChange={handleNameChange} autoComplete="off" />
            <TextField label="Description" value={descriptionHtml} onChange={handleDescriptionHtmlChange} multiline={6} autoComplete="off" />
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