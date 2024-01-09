import {
    IndexTable,
    Text,
    Button
} from "@shopify/polaris";

export default function ProductLine({products, handleOpenPopup}) {
    const lines = products.map((item) => {
        return (
        <IndexTable.Row key={item.node.id}>
        <IndexTable.Cell>
            <Text variant="bodyMd" fontWeight="bold" as="span">
            {item.node.title}
            </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{item.node.stock_status}</IndexTable.Cell>
        <IndexTable.Cell>
            <Button onClick={() => handleOpenPopup(item.node.id)}>Update</Button>
            <Button variant="primary" tone="critical">Delete</Button>
        </IndexTable.Cell>
        </IndexTable.Row>
        )
    })
    
    return lines;
}